// Local database tests (PGlite = real Postgres in WASM). Run: npm run test:db
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";
const ADMIN = "00000000-0000-4000-8000-0000000000ad";

let db;
const ctx = {};

async function as(role, uid, fn) {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [
    uid ? JSON.stringify({ sub: uid, role }) : "",
  ]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
const asAlice = (fn) => as("authenticated", ALICE, fn);
const asBob = (fn) => as("authenticated", BOB, fn);
const asAdmin = (fn) => as("authenticated", ADMIN, fn);
const asAnon = (fn) => as("anon", null, fn);
const asService = (fn) => as("service_role", null, fn);

async function rejects(fn, pattern) {
  await assert.rejects(fn, pattern ? { message: pattern } : undefined);
}

before(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(readFileSync(new URL("./stubs.sql", import.meta.url), "utf8"));
  const dir = new URL("../migrations/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(new URL(file, dir), "utf8"));
  }
  await db.exec(`
    insert into auth.users (id, email, raw_user_meta_data) values
      ('${ALICE}', 'alice@test.invalid', '{"display_name":"Alice"}'),
      ('${BOB}',   'bob@test.invalid',   '{"display_name":"Bob"}'),
      ('${ADMIN}', 'admin@test.invalid', '{}');
    insert into public.platform_admins (user_id) values ('${ADMIN}');
  `);
});

test("profile is created for new users", async () => {
  const r = await db.query(`select display_name from public.profiles where id = $1`, [ALICE]);
  assert.equal(r.rows[0].display_name, "Alice");
});

test("a user can create an organization but it always starts as draft and they become owner", async () => {
  await asAlice(async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, created_by, status)
       values ('store', 'alice-store', 'متجر أليس', $1, 'published') returning id, status`,
      [ALICE],
    );
    ctx.store = r.rows[0].id;
    assert.equal(r.rows[0].status, "draft");
    const m = await db.query(`select role from public.organization_members where organization_id = $1`, [ctx.store]);
    assert.deepEqual(m.rows.map((x) => x.role), ["owner"]);
  });
  await asAlice(async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, created_by)
       values ('gym', 'alice-gym', 'نادي أليس', $1) returning id`,
      [ALICE],
    );
    ctx.gym = r.rows[0].id;
  });
});

test("cannot create an organization on behalf of someone else (creator is forced to the caller)", async () => {
  await asBob(async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, created_by)
       values ('gym', 'bob-gym', 'نادي بوب', $1) returning id, created_by`,
      [ALICE],
    );
    assert.equal(r.rows[0].created_by, BOB);
    const m = await db.query(`select user_id from public.organization_members where organization_id = $1`, [r.rows[0].id]);
    assert.deepEqual(m.rows.map((x) => x.user_id), [BOB]);
  });
});

test("owners cannot publish or verify their own organization", async () => {
  await asAlice(async () => {
    await rejects(() => db.query(`update public.organizations set status = 'published' where id = $1`, [ctx.store]));
    await db.query(`update public.organizations set verified_at = now() where id = $1`, [ctx.store]);
    const r = await db.query(`select verified_at from public.organizations where id = $1`, [ctx.store]);
    assert.equal(r.rows[0].verified_at, null);
    await db.query(`update public.organizations set status = 'pending' where id = $1`, [ctx.store]);
  });
});

test("drafts are private; published organizations are public", async () => {
  await asAnon(async () => {
    const r = await db.query(`select id from public.organizations`);
    assert.equal(r.rows.length, 0);
  });
  await asAdmin(async () => {
    await db.query(`update public.organizations set status = 'published' where id in ($1, $2)`, [ctx.store, ctx.gym]);
  });
  await asAnon(async () => {
    const r = await db.query(`select id from public.organizations`);
    assert.equal(r.rows.length, 2);
  });
});

test("another user cannot edit someone else's organization", async () => {
  await asBob(async () => {
    const r = await db.query(`update public.organizations set name_ar = 'اختراق' where id = $1`, [ctx.store]);
    assert.equal(r.affectedRows, 0);
  });
  const r = await db.query(`select name_ar from public.organizations where id = $1`, [ctx.store]);
  assert.equal(r.rows[0].name_ar, "متجر أليس");
});

test("products: only members write, only stores own products", async () => {
  const cat = await db.query(`select id from public.product_categories where slug = 'weights'`);
  const sup = await db.query(`select id from public.product_categories where slug = 'supplements'`);
  ctx.weights = cat.rows[0].id;
  ctx.supplements = sup.rows[0].id;

  await asBob(() =>
    rejects(() =>
      db.query(
        `insert into public.products (organization_id, category_id, name_ar, price_jod) values ($1, $2, 'دمبل', 10)`,
        [ctx.store, ctx.weights],
      ),
    ),
  );
  await asAlice(() =>
    rejects(
      () =>
        db.query(
          `insert into public.products (organization_id, category_id, name_ar, price_jod) values ($1, $2, 'دمبل', 10)`,
          [ctx.gym, ctx.weights],
        ),
      /only belong to store/,
    ),
  );
  await asAlice(async () => {
    const r = await db.query(
      `insert into public.products (organization_id, category_id, name_ar, price_jod, is_published, availability)
       values ($1, $2, 'دمبل 10كغ', 25, true, 'available') returning id, moderation_status`,
      [ctx.store, ctx.weights],
    );
    ctx.dumbbell = r.rows[0].id;
    assert.equal(r.rows[0].moderation_status, "approved");
  });
});

test("supplements need admin approval and cannot self-approve", async () => {
  await asAlice(async () => {
    const r = await db.query(
      `insert into public.products (organization_id, category_id, name_ar, price_jod, is_published, moderation_status)
       values ($1, $2, 'بروتين', 40, true, 'approved') returning id, moderation_status`,
      [ctx.store, ctx.supplements],
    );
    ctx.protein = r.rows[0].id;
    assert.equal(r.rows[0].moderation_status, "pending");
  });
  await asAnon(async () => {
    const r = await db.query(`select id from public.products where id = $1`, [ctx.protein]);
    assert.equal(r.rows.length, 0);
  });
  await asAdmin(() =>
    db.query(`update public.products set moderation_status = 'approved' where id = $1`, [ctx.protein]),
  );
  await asAnon(async () => {
    const r = await db.query(`select id from public.products where id = $1`, [ctx.protein]);
    assert.equal(r.rows.length, 1);
  });
  await asAlice(async () => {
    await db.query(`update public.products set description_ar = 'ادعاء جديد' where id = $1`, [ctx.protein]);
    const r = await db.query(`select moderation_status from public.products where id = $1`, [ctx.protein]);
    assert.equal(r.rows[0].moderation_status, "pending");
  });
});

test("price timestamp moves only when price changes; organization_id cannot be moved", async () => {
  await asAlice(async () => {
    const before = await db.query(`select price_updated_at from public.products where id = $1`, [ctx.dumbbell]);
    await db.query(`update public.products set name_ar = 'دمبل 10 كغ' where id = $1`, [ctx.dumbbell]);
    const same = await db.query(`select price_updated_at from public.products where id = $1`, [ctx.dumbbell]);
    assert.equal(+same.rows[0].price_updated_at, +before.rows[0].price_updated_at);
    await db.query(`update public.products set price_jod = 30 where id = $1`, [ctx.dumbbell]);
    const after = await db.query(`select price_updated_at from public.products where id = $1`, [ctx.dumbbell]);
    assert.ok(+after.rows[0].price_updated_at > +before.rows[0].price_updated_at);

    await db.query(`update public.products set organization_id = $2 where id = $1`, [ctx.dumbbell, ctx.gym]).catch(() => {});
    const org = await db.query(`select organization_id from public.products where id = $1`, [ctx.dumbbell]);
    assert.equal(org.rows[0].organization_id, ctx.store);
  });
});

test("child rows cannot be moved to another organization", async () => {
  await asAlice(async () => {
    const r = await db.query(
      `insert into public.organization_hours (organization_id, weekday, opens_at, closes_at)
       values ($1, 0, '08:00', '22:00') returning id`,
      [ctx.gym],
    );
    await rejects(
      () => db.query(`update public.organization_hours set organization_id = $2 where id = $1`, [r.rows[0].id, ctx.store]),
      /cannot be changed/,
    );
  });
});

test("reviews: one per user, not for own org, identity cannot be forged, rating summary", async () => {
  await asBob(async () => {
    const r = await db.query(
      `insert into public.reviews (organization_id, user_id, rating, body)
       values ($1, $2, 4, 'جيد') returning id, user_id, author_name, status`,
      [ctx.gym, ALICE], // tries to impersonate alice
    );
    ctx.review = r.rows[0].id;
    assert.equal(r.rows[0].user_id, BOB);
    assert.equal(r.rows[0].author_name, "Bob");
    await rejects(() =>
      db.query(`insert into public.reviews (organization_id, user_id, rating) values ($1, $2, 5)`, [ctx.gym, BOB]),
    );
    await db.query(`update public.reviews set status = 'hidden', rating = 5 where id = $1`, [ctx.review]);
    const u = await db.query(`select status, rating from public.reviews where id = $1`, [ctx.review]);
    assert.equal(u.rows[0].status, "published");
    assert.equal(u.rows[0].rating, 5);
  });
  await asAlice(() =>
    rejects(
      () => db.query(`insert into public.reviews (organization_id, user_id, rating) values ($1, $2, 5)`, [ctx.gym, ALICE]),
      /own organization/,
    ),
  );
  await asAnon(async () => {
    const r = await db.query(`select review_count, average_rating from public.organization_ratings where organization_id = $1`, [ctx.gym]);
    assert.equal(r.rows[0].review_count, 1);
    assert.equal(Number(r.rows[0].average_rating), 5);
  });
});

test("review responses: only the organization can answer its own reviews", async () => {
  await asBob(() =>
    rejects(() =>
      db.query(
        `insert into public.review_responses (review_id, organization_id, body, created_by) values ($1, $2, 'شكراً', $3)`,
        [ctx.review, ctx.gym, BOB],
      ),
    ),
  );
  await asAlice(() =>
    db.query(
      `insert into public.review_responses (review_id, organization_id, body, created_by) values ($1, $2, 'شكراً لك', $3)`,
      [ctx.review, ctx.gym, ALICE],
    ),
  );
  await asAlice(() =>
    rejects(() =>
      db.query(
        `insert into public.review_responses (review_id, organization_id, body, created_by) values ($1, $2, 'x', $3)`,
        [ctx.review, ctx.store, ALICE], // mismatched organization
      ),
    ),
  );
});

test("review reports: reporter is the caller and duplicates are rejected", async () => {
  await asAlice(async () => {
    await db.query(`insert into public.review_reports (review_id, reporter_id, reason) values ($1, $2, 'fake')`, [ctx.review, ALICE]);
    await rejects(() => db.query(`insert into public.review_reports (review_id, reporter_id, reason) values ($1, $2, 'fake')`, [ctx.review, ALICE]));
    await rejects(() => db.query(`insert into public.review_reports (review_id, reporter_id, reason) values ($1, $2, 'spam')`, [ctx.review, BOB]));
  });
});

test("inquiries are server-only, de-duplicated, and private to the organization", async () => {
  const insert = () =>
    db.query(
      `insert into public.inquiries (organization_id, product_id, sender_phone, message, idempotency_key)
       values ($1, $2, '+962790000000', 'متوفر؟', 'idem-key-0001')`,
      [ctx.store, ctx.dumbbell],
    );
  await asAnon(() => rejects(insert));
  await asBob(() => rejects(insert));
  await asService(insert);
  await asService(() => rejects(insert));
  await asAlice(async () => {
    const r = await db.query(`select id from public.inquiries`);
    assert.equal(r.rows.length, 1);
  });
  await asBob(async () => {
    const r = await db.query(`select id from public.inquiries`);
    assert.equal(r.rows.length, 0);
  });
});

test("offers are visible only inside their time window", async () => {
  await asAlice(async () => {
    await db.query(
      `insert into public.offers (organization_id, title_ar, discount_percent, starts_at, ends_at)
       values ($1, 'عرض فعال', 20, now() - interval '1 day', now() + interval '1 day'),
              ($1, 'عرض منتهي', 20, now() - interval '3 day', now() - interval '2 day'),
              ($1, 'عرض قادم', 20, now() + interval '2 day', now() + interval '3 day')`,
      [ctx.gym],
    );
  });
  await asAnon(async () => {
    const r = await db.query(`select title_ar from public.offers`);
    assert.deepEqual(r.rows.map((x) => x.title_ar), ["عرض فعال"]);
  });
});

test("an organization always keeps an owner", async () => {
  await asAlice(async () => {
    await rejects(
      () => db.query(`delete from public.organization_members where organization_id = $1 and user_id = $2`, [ctx.gym, ALICE]),
      /at least one owner/,
    );
    await db.query(`insert into public.organization_members (organization_id, user_id, role) values ($1, $2, 'owner')`, [ctx.gym, BOB]);
    await db.query(`delete from public.organization_members where organization_id = $1 and user_id = $2`, [ctx.gym, ALICE]);
  });
  await asBob(async () => {
    const r = await db.query(`select user_id from public.organization_members where organization_id = $1`, [ctx.gym]);
    assert.deepEqual(r.rows.map((x) => x.user_id), [BOB]);
  });
});

test("storage: only owner/manager can upload into their own organization folder", async () => {
  const put = (name) => db.query(`insert into storage.objects (bucket_id, name) values ('org-media', $1)`, [name]);
  await asBob(() => rejects(() => put(`${ctx.store}/a.png`)));
  await asAlice(async () => {
    await put(`${ctx.store}/a.png`);
    await rejects(() => put(`${ctx.gym}/b.png`)); // alice left the gym org
    await rejects(() => put(`not-a-uuid/c.png`));
  });
});

test("analytics and audit data are not readable by the public", async () => {
  await asService(() =>
    db.query(`insert into public.analytics_events (organization_id, event_type) values ($1, 'page_view')`, [ctx.store]),
  );
  await asAnon(() => rejects(() => db.query(`select 1 from public.analytics_events`)).catch(() => {}));
  await asAnon(async () => {
    const r = await db.query(`select id from public.analytics_events`).catch(() => ({ rows: [] }));
    assert.equal(r.rows.length, 0);
  });
  await asBob(async () => {
    const r = await db.query(`select id from public.analytics_events`);
    assert.equal(r.rows.length, 0);
  });
  await asAlice(async () => {
    const r = await db.query(`select id from public.analytics_events`);
    assert.equal(r.rows.length, 1);
  });
  await asAlice(async () => {
    const r = await db.query(`select id from public.audit_logs`);
    assert.equal(r.rows.length, 0);
  });
});

test("platform_admins is invisible to normal users", async () => {
  await asAlice(async () => {
    const r = await db.query(`select user_id from public.platform_admins`);
    assert.equal(r.rows.length, 0);
  });
});

test("deleting an organization (admin) cascades cleanly", async () => {
  await asAdmin(async () => {
    await db.query(`delete from public.organizations where id = $1`, [ctx.store]);
    const r = await db.query(`select id from public.products where organization_id = $1`, [ctx.store]);
    assert.equal(r.rows.length, 0);
  });
});

test("nutritionist type: owner can set license fields but cannot self-verify; products stay store-only", async () => {
  const id = await asAlice(async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, created_by, license_number, license_authority)
       values ('nutritionist', 'nutri-test', 'أخصائي اختبار', $1, 'L-123', 'جهة الاختبار') returning id`, [ALICE]);
    return r.rows[0].id;
  });
  await asAlice(async () => {
    await db.query(`update public.organizations set license_number = 'L-456' where id = $1`, [id]);
    await db.query(`update public.organizations set verified_at = now() where id = $1`, [id]);
    const v = await db.query(`select verified_at from public.organizations where id = $1`, [id]);
    assert.equal(v.rows[0].verified_at, null); // guard silently locks it
    await rejects(() => db.query(
      `insert into public.products (organization_id, category_id, name_ar, price_jod)
       values ($1, (select id from public.product_categories limit 1), 'x', 1)`, [id]));
  });
  await asAdmin(async () => {
    await db.query(`update public.organizations set status = 'published', verified_at = now() where id = $1`, [id]);
  });
  await asAnon(async () => {
    const r = await db.query(`select license_number, verified_at is not null as v from public.organizations where id = $1`, [id]);
    assert.equal(r.rows[0].license_number, "L-456");
    assert.equal(r.rows[0].v, true);
  });
});

test("product image path must live inside the product's own organization folder", async () => {
  const org = await db.query(`select id from public.organizations where slug = 'nutri-test'`);
  const store = await asAlice(async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, created_by) values ('store', 'img-store', 'متجر صور', $1) returning id`, [ALICE]);
    return r.rows[0].id;
  });
  const cat = (await db.query(`select id from public.product_categories where requires_review = false limit 1`)).rows[0].id;
  await asAlice(async () => {
    await db.query(
      `insert into public.products (organization_id, category_id, name_ar, price_jod, image_path)
       values ($1, $2, 'منتج', 5, $3)`, [store, cat, `${store}/p1.webp`]);
    await rejects(() => db.query(
      `insert into public.products (organization_id, category_id, name_ar, price_jod, image_path)
       values ($1, $2, 'منتج2', 5, $3)`, [store, cat, `${org.rows[0].id}/stolen.webp`]));
  });
});

test("featured placement is admin-only and expires; listing view sorts featured first", async () => {
  const { rows } = await db.query(`select id from public.organizations where slug = 'nutri-test'`);
  const id = rows[0].id;
  await asAlice(async () => {
    await rejects(() => db.query(
      `insert into public.org_promotions (organization_id, featured_until) values ($1, now() + interval '30 days')`, [id]));
  });
  await asAdmin(() => db.query(
    `insert into public.org_promotions (organization_id, featured_until, featured_rank) values ($1, now() + interval '30 days', 5)`, [id]));
  await asAnon(async () => {
    const r = await db.query(`select slug, is_featured from public.organizations_listing order by is_featured desc, featured_rank desc limit 1`);
    assert.equal(r.rows[0].slug, 'nutri-test');
    assert.equal(r.rows[0].is_featured, true);
  });
  await asAdmin(() => db.query(`update public.org_promotions set featured_until = now() - interval '1 day' where organization_id = $1`, [id]));
  await asAnon(async () => {
    const r = await db.query(`select is_featured from public.organizations_listing where slug = 'nutri-test'`);
    assert.equal(r.rows[0].is_featured, false);
  });
});

test("members, plans and programs are private to the business; token page exposes only that program", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  let plan, member, token;
  await asAlice(async () => {
    plan = (await db.query(
      `insert into public.membership_plans (organization_id, name_ar, duration_days, price_jod) values ($1, 'شهري', 30, 25) returning id`, [org])).rows[0].id;
    member = (await db.query(
      `insert into public.org_members (organization_id, full_name, phone, plan_id, ends_on)
       values ($1, 'سامر', '+962791234567', $2, current_date + 30) returning id`, [org, plan])).rows[0].id;
    token = (await db.query(
      `insert into public.member_programs (organization_id, member_id, kind, title, body)
       values ($1, $2, 'workout', 'برنامج صدر', 'اليوم 1: ضغط') returning access_token`, [org, member])).rows[0].access_token;
  });
  await asBob(async () => {
    assert.equal((await db.query(`select id from public.org_members`)).rows.length, 0);
    assert.equal((await db.query(`select id from public.member_programs`)).rows.length, 0);
    assert.equal((await db.query(`select id from public.membership_plans`)).rows.length, 0);
    await rejects(() => db.query(
      `insert into public.org_members (organization_id, full_name, phone, ends_on) values ($1, 'دخيل', '+962790000000', current_date)`, [org]));
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.org_members`).catch(() => ({ rows: [] }))).rows.length, 0);
    const r = await db.query(`select title, body, member_name from public.get_program_by_token($1)`, [token]);
    assert.equal(r.rows.length, 1);
    assert.equal(r.rows[0].title, 'برنامج صدر');
    const none = await db.query(`select * from public.get_program_by_token('00000000-0000-4000-8000-000000000000')`);
    assert.equal(none.rows.length, 0);
  });
});

test("admin dashboard functions work for the admin only", async () => {
  await asAdmin(async () => {
    const users = await db.query(`select email, is_admin from public.admin_list_users()`);
    assert.ok(users.rows.some((u) => u.email === 'alice@test.invalid'));
    assert.equal(users.rows.find((u) => u.email === 'admin@test.invalid').is_admin, true);
    const stats = (await db.query(`select public.admin_stats() as s`)).rows[0].s;
    assert.ok(stats.users_total >= 3);
    assert.ok(stats.orgs_by_status);
    await db.query(`select * from public.admin_top_orgs(30)`);
  });
  for (const run of [asAlice, asAnon]) {
    await run(async () => {
      await rejects(() => db.query(`select * from public.admin_list_users()`));
      await rejects(() => db.query(`select public.admin_stats()`));
      await rejects(() => db.query(`select * from public.admin_top_orgs(30)`));
    });
  }
});

test("platform admin can manage members and media of any business; strangers still cannot", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  await asAdmin(async () => {
    assert.ok((await db.query(`select id from public.org_members where organization_id = $1`, [org])).rows.length >= 1);
    const plan = (await db.query(
      `insert into public.membership_plans (organization_id, name_ar, duration_days) values ($1, 'أدمن', 7) returning id`, [org])).rows[0].id;
    assert.ok(plan);
    await db.query(`insert into storage.objects (bucket_id, name) values ('org-media', $1)`, [`${org}/admin-upload.webp`]);
  });
  await asBob(async () => {
    await rejects(() => db.query(`insert into storage.objects (bucket_id, name) values ('org-media', $1)`, [`${org}/bob.webp`]));
  });
});

test("ads: public sees only live ads without accounting data; only admin writes", async () => {
  await asAdmin(async () => {
    const a = (await db.query(
      `insert into public.ads (placement, title, link_url, starts_at, ends_at)
       values ('banner', 'إعلان حي', 'https://example.com', now() - interval '1 day', now() + interval '5 days') returning id`)).rows[0].id;
    await db.query(`insert into public.ads (placement, title, link_url, starts_at, ends_at)
       values ('banner', 'إعلان منتهي', 'https://example.com', now() - interval '9 days', now() - interval '2 days')`);
    await db.query(`insert into public.ad_accounting (ad_id, advertiser_name, price_jod) values ($1, 'شركة', 150)`, [a]);
  });
  await asAnon(async () => {
    const r = await db.query(`select title from public.ads`);
    assert.deepEqual(r.rows.map((x) => x.title), ['إعلان حي']);
    assert.equal((await db.query(`select * from public.ad_accounting`)).rows.length, 0);
    await rejects(() => db.query(`insert into public.ads (placement, title, link_url, starts_at, ends_at) values ('banner', 'x1', 'https://a.co', now(), now() + interval '1 day')`));
  });
  await asAlice(async () => {
    assert.equal((await db.query(`select * from public.ad_accounting`)).rows.length, 0);
    await rejects(() => db.query(`insert into public.ads (placement, title, link_url, starts_at, ends_at) values ('banner', 'x2', 'https://a.co', now(), now() + interval '1 day')`));
    await rejects(() => db.query(`insert into public.ads (placement, title, link_url, starts_at, ends_at) values ('banner', 'x3', 'javascript:alert(1)', now(), now() + interval '1 day')`));
  });
});

test("subscriptions: owner reads own record, strangers don't, only admin writes; domains: verified only is public", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  await asAdmin(() => db.query(
    `insert into public.org_subscriptions (organization_id, plan_name, amount_jod, period_end) values ($1, 'شهري', 20, current_date + 30)`, [org]));
  await asAlice(async () => {
    assert.equal((await db.query(`select * from public.org_subscriptions`)).rows.length, 1);
    await rejects(() => db.query(`insert into public.org_subscriptions (organization_id, plan_name, amount_jod, period_end) values ($1, 'ذاتي', 0, current_date)`, [org]));
    await db.query(`insert into public.org_domains (organization_id, domain) values ($1, 'nutri-example.com')`, [org]);
    await rejects(() => db.query(`insert into public.org_domains (organization_id, domain, status) values ($1, 'other-example.com', 'verified')`, [org]));
  });
  await asBob(async () => {
    assert.equal((await db.query(`select * from public.org_subscriptions`)).rows.length, 0);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select * from public.org_domains`)).rows.length, 0);
  });
  await asAdmin(() => db.query(`update public.org_domains set status = 'verified' where organization_id = $1`, [org]));
  await asAnon(async () => {
    const r = await db.query(`select domain from public.org_domains`);
    assert.equal(r.rows[0].domain, 'nutri-example.com');
  });
});
