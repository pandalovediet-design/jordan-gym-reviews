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

test("categories: public read, admin-only write; type mismatch rejected; Pink Zone + maps link validated", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  await asAnon(async () => {
    assert.ok((await db.query(`select * from public.org_categories`)).rows.length >= 10);
    await rejects(() => db.query(`insert into public.org_categories (slug, org_type, name_ar) values ('hack', 'gym', 'اختراق')`));
  });
  await asAlice(async () => {
    await rejects(() => db.query(`insert into public.org_categories (slug, org_type, name_ar) values ('mine', 'gym', 'تصنيفي')`));
    // wrong type
    await rejects(() => db.query(`update public.organizations set category_id = (select id from public.org_categories where slug = 'pools') where id = $1`, [org]), "category does not match organization type");
    // right type
    await db.query(`update public.organizations set category_id = (select id from public.org_categories where slug = 'nutritionists') where id = $1`, [org]);
    // Pink Zone and hours note are owner-editable
    await db.query(`update public.organizations set women_access = 'women_hours', women_hours_note = 'الأحد والثلاثاء 4-8م' where id = $1`, [org]);
    await rejects(() => db.query(`update public.organizations set women_access = 'everyone' where id = $1`, [org]));
    // maps link: only Google Maps links
    await db.query(`update public.organizations set maps_url = 'https://maps.app.goo.gl/abc123' where id = $1`, [org]);
    await db.query(`update public.organizations set maps_url = 'https://www.google.com/maps/place/Amman' where id = $1`, [org]);
    await rejects(() => db.query(`update public.organizations set maps_url = 'https://evil.example.com/maps' where id = $1`, [org]));
    await rejects(() => db.query(`update public.organizations set maps_url = 'javascript:alert(1)' where id = $1`, [org]));
  });
  await asAdmin(async () => {
    await db.query(`update public.organizations set status = 'published' where id = $1`, [org]);
    await db.query(`update public.organizations set women_access = 'none' where id = $1`, [org]);
  });
  await asAnon(async () => {
    const r = (await db.query(`select category_slug, category_name, women_access from public.organizations_listing where id = $1`, [org])).rows[0];
    assert.equal(r.category_slug, 'nutritionists');
    assert.equal(r.women_access, 'none');
  });
});

test("free trial note, min price in listing, class schedule RLS", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  await asAlice(async () => {
    await db.query(`update public.organizations set free_trial_note = 'يوم تجريبي مجاني' where id = $1`, [org]);
    await rejects(() => db.query(`update public.organizations set free_trial_note = 'x' where id = $1`, [org]));
    await db.query(`insert into public.organization_services (organization_id, name_ar, price_jod, billing_period) values ($1, 'شهري', 30, 'month'), ($1, 'يومي', 5, 'session')`, [org]);
    await db.query(`insert into public.org_classes (organization_id, title_ar, weekday, starts_at) values ($1, 'يوغا', 0, '18:00')`, [org]);
    await rejects(() => db.query(`insert into public.org_classes (organization_id, title_ar, weekday, starts_at) values ($1, 'يوغا', 9, '18:00')`, [org]));
  });
  await asBob(async () => {
    await rejects(() => db.query(`insert into public.org_classes (organization_id, title_ar, weekday, starts_at) values ($1, 'اختراق', 1, '10:00')`, [org]));
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select * from public.org_classes where organization_id = $1`, [org])).rows.length, 1);
    const r = (await db.query(`select free_trial_note, min_price_jod from public.organizations_listing where id = $1`, [org])).rows[0];
    assert.equal(r.free_trial_note, 'يوم تجريبي مجاني');
    assert.equal(Number(r.min_price_jod), 30); // monthly plan wins over the cheaper day pass
  });
});

test("branches: main branch auto-created, per-branch content, trainers, RLS", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  const main = (await db.query(`select id from public.org_branches where organization_id = $1 and is_main`, [org])).rows;
  assert.equal(main.length, 1);
  const mainId = main[0].id;
  let branchId;
  await asAlice(async () => {
    // cannot create a second main, cannot delete main, extra branch needs a city
    await rejects(() => db.query(`insert into public.org_branches (organization_id, name_ar, is_main) values ($1, 'x2', true)`, [org]));
    await rejects(() => db.query(`insert into public.org_branches (organization_id, name_ar) values ($1, 'بدون مدينة')`, [org]));
    const r = await db.query(`insert into public.org_branches (organization_id, name_ar, city, latitude, longitude, women_access) values ($1, 'فرع إربد', 'إربد', 32.55, 35.85, 'women_only') returning id`, [org]);
    branchId = r.rows[0].id;
    await db.query(`delete from public.org_branches where id = $1`, [mainId]);
    assert.equal((await db.query(`select 1 from public.org_branches where id = $1`, [mainId])).rows.length, 1);
    await rejects(() => db.query(`update public.org_branches set is_main = true where id = $1`, [branchId]));
    // per-branch price / offer / hours / trainer
    await db.query(`insert into public.organization_services (organization_id, branch_id, name_ar, price_jod, billing_period) values ($1, $2, 'شهري إربد', 20, 'month')`, [org, branchId]);
    await db.query(`insert into public.organization_hours (organization_id, branch_id, weekday, opens_at, closes_at) values ($1, $2, 0, '08:00', '22:00')`, [org, branchId]);
    await rejects(() => db.query(`insert into public.organization_hours (organization_id, branch_id, weekday, opens_at, closes_at) values ($1, $2, 0, '09:00', '21:00')`, [org, branchId]));
    await db.query(`insert into public.org_trainers (organization_id, branch_id, name_ar, title_ar, experience_years) values ($1, $2, 'كابتن أحمد', 'كمال أجسام', 8)`, [org, branchId]);
    await rejects(() => db.query(`insert into public.org_trainers (organization_id, name_ar, photo_path) values ($1, 'صورة غريبة', 'other/x.jpg')`, [org]));
  });
  // a branch of another organization cannot be referenced
  const other = (await db.query(`select id from public.organizations where id <> $1 limit 1`, [org])).rows[0];
  if (other) await asAdmin(() => rejects(() => db.query(`insert into public.organization_services (organization_id, branch_id, name_ar) values ($1, $2, 'تسلل')`, [other.id, branchId])));
  await asBob(async () => {
    await rejects(() => db.query(`insert into public.org_branches (organization_id, name_ar, city) values ($1, 'اختراق', 'عمّان')`, [org]));
    await rejects(() => db.query(`insert into public.org_trainers (organization_id, name_ar) values ($1, 'مخترق')`, [org]));
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select 1 from public.org_branches where organization_id = $1`, [org])).rows.length, 2);
    assert.equal((await db.query(`select 1 from public.org_trainers where organization_id = $1`, [org])).rows.length, 1);
    const l = (await db.query(`select branch_count, branch_cities, branch_women_only, branch_points from public.organizations_listing where id = $1`, [org])).rows[0];
    assert.equal(Number(l.branch_count), 2);
    assert.deepEqual(l.branch_cities, ['إربد']);
    assert.equal(l.branch_women_only, true);
    assert.equal(l.branch_points.length, 1);
  });
});

test("glow, flash slots, partners, trails, healthy food", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  // glow: admin only; expires by itself
  await asAlice(() => rejects(() => db.query(`insert into public.org_promotions (organization_id, glow_color, glow_until) values ($1, 'gold', now() + interval '30 days')`, [org])));
  await asAdmin(async () => {
    await db.query(`insert into public.org_promotions (organization_id, glow_color, glow_until) values ($1, 'pink', now() + interval '30 days') on conflict (organization_id) do update set glow_color = 'pink', glow_until = now() + interval '30 days'`, [org]);
    await rejects(() => db.query(`update public.org_promotions set glow_color = 'red' where organization_id = $1`, [org]));
    await rejects(() => db.query(`update public.org_promotions set glow_color = null where organization_id = $1`, [org])); // pair must be both null or both set
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select glow_color from public.organizations_listing where id = $1`, [org])).rows[0].glow_color, 'pink');
  });
  // flash slots
  let slot;
  await asAlice(() => rejects(() => db.query(`insert into public.flash_slots (organization_id, starts_at, ends_at) values ($1, now(), now() + interval '24 hours')`, [org])));
  await asAdmin(async () => {
    await rejects(() => db.query(`insert into public.flash_slots (organization_id, starts_at, ends_at) values ($1, now(), now() + interval '49 hours')`, [org]));
    slot = (await db.query(`insert into public.flash_slots (organization_id, starts_at, ends_at) values ($1, now() - interval '1 hour', now() + interval '24 hours') returning id`, [org])).rows[0].id;
  });
  await asAnon(async () => assert.equal((await db.query(`select * from public.flash_slots`)).rows.length, 0)); // no content yet
  await asAlice(async () => {
    await db.query(`update public.flash_slots set title_ar = 'خصم الفلاش', discount_percent = 30 where id = $1`, [slot]);
    await rejects(() => db.query(`update public.flash_slots set ends_at = ends_at + interval '10 hours' where id = $1`, [slot]));
  });
  await asBob(async () => assert.equal((await db.query(`update public.flash_slots set title_ar = 'تسلل' where id = $1`, [slot])).affectedRows, 0));
  await asAdmin(() => db.query(`update public.organizations set status = 'published' where id = $1`, [org]));
  await asAnon(async () => assert.equal((await db.query(`select title_ar from public.flash_slots`)).rows[0].title_ar, 'خصم الفلاش'));
  // partners & trails
  await asAlice(() => rejects(() => db.query(`insert into public.partners (name_ar, logo_path) values ('شريك', 'p.png')`)));
  await asAdmin(async () => {
    await db.query(`insert into public.partners (name_ar, logo_path, link_url) values ('شريك', 'p.png', 'https://example.com')`);
    await rejects(() => db.query(`insert into public.partners (name_ar, logo_path, link_url) values ('سيئ', 'p.png', 'http://x.com')`));
    await db.query(`insert into public.trails (slug, name_ar, region, difficulty, distance_km, is_published) values ('wadi-mujib', 'وادي الموجب', 'مأدبا', 'hard', 5.5, true), ('draft-trail', 'مسار مسودة', 'عجلون', 'easy', 3, false)`);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select * from public.partners`)).rows.length, 1);
    assert.deepEqual((await db.query(`select slug from public.trails`)).rows.map((r) => r.slug), ['wadi-mujib']);
    await rejects(() => db.query(`insert into public.trails (slug, name_ar, region) values ('hack-trail', 'x', 'y')`));
  });
  // healthy food
  const hf = (await db.query(`select id from public.org_categories where slug = 'home-chefs'`)).rows[0].id;
  await asAlice(async () => {
    const r = await db.query(`insert into public.organizations (type, slug, name_ar, created_by, status, category_id, delivery_modes) values ('healthy_food', 'chef-test', 'مطبخ تجريبي', $1, 'draft', $2, array['own_delivery','pickup']) returning id`, [ALICE, hf]);
    const id = r.rows[0].id;
    await db.query(`insert into public.menu_items (organization_id, name_ar, price_jod, calories, protein_g) values ($1, 'سلطة دجاج', 4.5, 380, 35)`, [id]);
    await rejects(() => db.query(`update public.organizations set delivery_modes = array['drone'] where id = $1`, [id]));
    await rejects(() => db.query(`insert into public.menu_items (organization_id, name_ar, price_jod, calories) values ($1, 'سالب', -1, 10)`, [id]));
  });
});

test("visitor reports and verified-badge expiry", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  // anyone can report a published page, nobody but admins can read reports
  await asAnon(async () => {
    await db.query(`insert into public.listing_reports (organization_id, reason, details) values ($1, 'wrong_info', 'رقم خاطئ')`, [org]);
    assert.equal((await db.query(`select * from public.listing_reports`)).rows.length, 0);
    await rejects(() => db.query(`insert into public.listing_reports (organization_id, reason, status) values ($1, 'fake', 'handled')`, [org]));
    await rejects(() => db.query(`insert into public.listing_reports (organization_id, reason) values ($1, 'bogus')`, [org]));
  });
  await asAlice(async () => {
    assert.equal((await db.query(`select * from public.listing_reports`)).rows.length, 0);
    const u = await db.query(`update public.listing_reports set status = 'handled'`);
    assert.equal(u.affectedRows, 0);
  });
  await asAdmin(async () => {
    assert.equal((await db.query(`select * from public.listing_reports`)).rows.length, 1);
    await db.query(`update public.listing_reports set status = 'handled'`);
  });
  // throttle: at most 10 reports per page per hour
  await asAnon(async () => {
    for (let i = 0; i < 9; i++) await db.query(`insert into public.listing_reports (organization_id, reason) values ($1, 'other')`, [org]);
    await rejects(() => db.query(`insert into public.listing_reports (organization_id, reason) values ($1, 'other')`, [org]), /too many reports/);
  });
  // verified badge expires; owners cannot extend it
  await asAdmin(async () => {
    await db.query(`update public.organizations set verified_at = now(), verified_until = now() + interval '30 days' where id = $1`, [org]);
  });
  await asAnon(async () => {
    assert.ok((await db.query(`select verified_at from public.organizations_listing where id = $1`, [org])).rows[0].verified_at);
  });
  await asAdmin(async () => {
    await db.query(`update public.organizations set verified_until = now() - interval '1 day' where id = $1`, [org]);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select verified_at from public.organizations_listing where id = $1`, [org])).rows[0].verified_at, null);
  });
  const owner = (await db.query(`select created_by from public.organizations where id = $1`, [org])).rows[0].created_by;
  const as_owner = owner === ALICE ? asAlice : owner === BOB ? asBob : null;
  if (as_owner) {
    await as_owner(async () => {
      await db.query(`update public.organizations set verified_until = now() + interval '900 days' where id = $1`, [org]);
    });
    const r = (await db.query(`select verified_until > now() as active from public.organizations where id = $1`, [org])).rows[0];
    assert.equal(r.active, false);
  }
});

test("QR check-in: staff only, once per 8 hours, expired members are flagged, member page by token", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  const m = (await db.query(`select id, access_token from public.org_members where organization_id = $1 limit 1`, [org])).rows[0];
  const expired = await asAlice(async () => (await db.query(
    `insert into public.org_members (organization_id, full_name, phone, starts_on, ends_on)
     values ($1, 'منتهي', '+962795550000', current_date - 60, current_date - 5) returning id, access_token`, [org])).rows[0]);
  // outsider cannot record; unknown token fails; anon cannot call
  await asBob(async () => { await rejects(() => db.query(`select * from public.record_checkin($1)`, [m.access_token]), /not allowed/); });
  await asAnon(async () => { await rejects(() => db.query(`select * from public.record_checkin($1)`, [m.access_token])); });
  await asAlice(async () => {
    await rejects(() => db.query(`select * from public.record_checkin('00000000-0000-4000-8000-000000000000')`), /member not found/);
    const a = (await db.query(`select * from public.record_checkin($1)`, [m.access_token])).rows[0];
    assert.equal(a.duplicate, false);
    assert.equal(a.expired, false);
    const b = (await db.query(`select * from public.record_checkin($1)`, [m.access_token])).rows[0];
    assert.equal(b.duplicate, true);
    assert.equal((await db.query(`select id from public.member_checkins where member_id = $1`, [m.id])).rows.length, 1);
  });
  // more than 8 hours later a new attendance is recorded
  await db.query(`update public.member_checkins set checked_in_at = now() - interval '9 hours' where member_id = $1`, [m.id]);
  await asAlice(async () => {
    const c = (await db.query(`select * from public.record_checkin($1)`, [m.access_token])).rows[0];
    assert.equal(c.duplicate, false);
    assert.equal((await db.query(`select id from public.member_checkins where member_id = $1`, [m.id])).rows.length, 2);
    // expired subscription is recorded but flagged
    const e = (await db.query(`select * from public.record_checkin($1)`, [expired.access_token])).rows[0];
    assert.equal(e.expired, true);
    assert.equal(e.duplicate, false);
    assert.equal((await db.query(`select was_expired from public.member_checkins where member_id = $1`, [expired.id])).rows[0].was_expired, true);
    // staff cannot forge attendance with a direct insert
    await rejects(() => db.query(`insert into public.member_checkins (organization_id, member_id) values ($1, $2)`, [org, m.id]));
  });
  await asBob(async () => { assert.equal((await db.query(`select id from public.member_checkins`)).rows.length, 0); });
  // member page exposes only what the token opens
  await db.exec(`update public.organizations set status = 'published' where id = '${org}'`);
  await asAnon(async () => {
    const r = (await db.query(`select member_name, days_left from public.get_member_by_token($1)`, [m.access_token])).rows;
    assert.equal(r.length, 1);
    assert.ok(r[0].days_left >= 0);
    assert.equal((await db.query(`select * from public.get_member_programs($1)`, [m.access_token])).rows.length, 1);
    assert.equal((await db.query(`select * from public.get_member_by_token('00000000-0000-4000-8000-000000000000')`)).rows.length, 0);
    assert.equal((await db.query(`select access_token from public.org_members`).catch(() => ({ rows: [] }))).rows.length, 0);
  });
});

test("member page v2: coach note and own attendance by token only", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  const m = (await db.query(`select id, access_token from public.org_members where organization_id = $1 order by created_at limit 1`, [org])).rows[0];
  await asAlice(async () => {
    await db.query(`update public.org_members set coach_note = 'ممتاز، كمّل' where id = $1`, [m.id]);
  });
  await asBob(async () => {
    await db.query(`update public.org_members set coach_note = 'x' where id = $1`, [m.id]);
    assert.equal((await db.query(`select coach_note from public.org_members`)).rows.length, 0);
  });
  await asAnon(async () => {
    const r = (await db.query(`select coach_note from public.get_member_page($1)`, [m.access_token])).rows[0];
    assert.equal(r.coach_note, 'ممتاز، كمّل');
    const a = (await db.query(`select * from public.get_member_attendance($1)`, [m.access_token])).rows;
    assert.ok(a.length >= 1 && a.length <= 10);
    assert.ok(Number(a[0].month_count) >= 1);
    assert.equal((await db.query(`select * from public.get_member_attendance('00000000-0000-4000-8000-000000000000')`)).rows.length, 0);
  });
});

test("member files: staff only, 10 per member, member sees the list and a file path only with the token", async () => {
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  const m = (await db.query(`select id, access_token from public.org_members where organization_id = $1 order by created_at limit 1`, [org])).rows[0];
  const other = (await db.query(`select access_token from public.org_members where organization_id = $1 order by created_at desc limit 1`, [org])).rows[0];
  let fid;
  await asAlice(async () => {
    fid = (await db.query(
      `insert into public.member_files (organization_id, member_id, title, storage_path, size_bytes)
       values ($1, $2, 'برنامجي', $3, 1000) returning id`, [org, m.id, `${org}/a.pdf`])).rows[0].id;
    // path must live in the org's folder
    await rejects(() => db.query(
      `insert into public.member_files (organization_id, member_id, title, storage_path, size_bytes)
       values ($1, $2, 'غلط', 'other/b.pdf', 1000)`, [org, m.id]));
    for (let i = 0; i < 9; i++) {
      await db.query(`insert into public.member_files (organization_id, member_id, title, storage_path, size_bytes)
        values ($1, $2, 'ملف ' || $3::text, $4, 500)`, [org, m.id, i, `${org}/f${i}.pdf`]);
    }
    await rejects(() => db.query(`insert into public.member_files (organization_id, member_id, title, storage_path, size_bytes)
      values ($1, $2, 'الحادي عشر', $3, 500)`, [org, m.id, `${org}/z.pdf`]), /too many files/);
  });
  await asBob(async () => {
    assert.equal((await db.query(`select id from public.member_files`)).rows.length, 0);
    await rejects(() => db.query(`insert into public.member_files (organization_id, member_id, title, storage_path, size_bytes)
      values ($1, $2, 'دخيل', $3, 500)`, [org, m.id, `${org}/x.pdf`]));
  });
  await db.exec(`update public.organizations set status = 'published' where id = '${org}'`);
  await asAnon(async () => {
    assert.equal((await db.query(`select * from public.get_member_files($1)`, [m.access_token])).rows.length, 10);
    assert.equal((await db.query(`select public.get_member_file_path($1, $2) as p`, [m.access_token, fid])).rows[0].p, `${org}/a.pdf`);
    // another member's token cannot reach this file
    assert.equal((await db.query(`select public.get_member_file_path($1, $2) as p`, [other.access_token, fid])).rows[0].p, null);
    assert.equal((await db.query(`select id from public.member_files`).catch(() => ({ rows: [] }))).rows.length, 0);
  });
});

test("coach-gym links: complete profile required, gym approves, either side removes, public sees approved only", async () => {
  const gym = (await db.query(`insert into public.organizations (type, slug, name_ar, created_by, status) values ('gym', 'cg-gym', 'نادي الربط', $1, 'published') returning id`, [ALICE])).rows[0].id;
  const coach = (await db.query(`insert into public.organizations (type, slug, name_ar, created_by, status) values ('independent_coach', 'cg-coach', 'كابتن ربط', $1, 'published') returning id`, [BOB])).rows[0].id;
  let linkId;
  await asBob(async () => {
    // no profile yet -> refused
    await rejects(() => db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id) values ($1, $2)`, [gym, coach]), /incomplete/);
    await db.query(`insert into public.coach_profiles (organization_id, role_label, experience_years, education, education_place, specialties) values ($1, 'مدرب لياقة', 5, 'بكالوريوس تربية رياضية', 'الجامعة الأردنية', 'لياقة، تضخيم')`, [coach]);
    // still no photo
    await rejects(() => db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id) values ($1, $2)`, [gym, coach]), /incomplete/);
  });
  await db.query(`insert into public.organization_media (organization_id, storage_path) values ($1, $2)`, [coach, `${coach}/p.jpg`]);
  await asBob(async () => {
    // tries to self-approve on insert: forced back to pending
    linkId = (await db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id, status) values ($1, $2, 'approved') returning id, status`, [gym, coach])).rows[0].id;
    assert.equal((await db.query(`select status from public.coach_gym_links where id = $1`, [linkId])).rows[0].status, "pending");
    // coach cannot approve
    await db.query(`update public.coach_gym_links set status = 'approved' where id = $1`, [linkId]).catch(() => {});
    assert.equal((await db.query(`select status from public.coach_gym_links where id = $1`, [linkId])).rows[0].status, "pending");
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select * from public.get_gym_coaches($1)`, [gym])).rows.length, 0);
  });
  await asAlice(async () => {
    assert.equal((await db.query(`select * from public.list_gym_coach_links($1)`, [gym])).rows.length, 1);
    await db.query(`update public.coach_gym_links set status = 'approved' where id = $1`, [linkId]);
  });
  await asAnon(async () => {
    const r = (await db.query(`select * from public.get_gym_coaches($1)`, [gym])).rows;
    assert.equal(r.length, 1);
    assert.equal(r[0].coach_slug, "cg-coach");
    assert.equal(r[0].photo_path, `${coach}/p.jpg`);
    assert.equal((await db.query(`select * from public.get_coach_gyms($1)`, [coach])).rows[0].gym_slug, "cg-gym");
    await rejects(() => db.query(`select * from public.list_gym_coach_links($1)`, [gym]));
  });
  await asBob(async () => {
    await db.query(`delete from public.coach_gym_links where id = $1`, [linkId]);
    assert.equal((await db.query(`select * from public.list_coach_gym_links($1)`, [coach])).rows.length, 0);
  });
});

test("facility slots + product old price", async () => {
  let fac;
  await asAdmin(async () => { fac = (await db.query(`insert into public.organizations (type, slug, name_ar, created_by) values ('sports_facility', 'slot-fac', 'ملعب المواعيد', $1) returning id`, [ADMIN])).rows[0].id; });
  await db.exec(`update public.organizations set status = 'published' where id = '${fac}'`);
  await asAdmin(async () => {
    await db.query(`insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at) values ($1, (now() at time zone 'Asia/Amman')::date + 1, '18:00', '19:00')`, [fac]);
    await rejects(() => db.query(`insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at) values ($1, (now() at time zone 'Asia/Amman')::date + 1, '18:00', '19:30')`, [fac]));
    await rejects(() => db.query(`insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at) values ($1, (now() at time zone 'Asia/Amman')::date + 1, '20:00', '19:00')`, [fac]));
    await rejects(() => db.query(`insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at) values ($1, (now() at time zone 'Asia/Amman')::date + 200, '10:00', '11:00')`, [fac]));
    await db.query(`update public.facility_slots set status = 'booked' where organization_id = $1`, [fac]);
  });
  await asBob(async () => {
    assert.equal((await db.query(`update public.facility_slots set status = 'available' where organization_id = $1 returning id`, [fac])).rows.length, 0);
  });
  await asAnon(async () => {
    const r = (await db.query(`select status from public.facility_slots where organization_id = $1`, [fac])).rows;
    assert.deepEqual(r.map((x) => x.status), ["booked"]);
  });
  // not a facility -> refused
  const gym = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  await asAlice(async () => {
    await rejects(() => db.query(`insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at) values ($1, (now() at time zone 'Asia/Amman')::date + 1, '10:00', '11:00')`, [gym]), /facilities only/);
  });
});

test("monthly votes + member streak", async () => {
  const gymId = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  // BOB's account is brand new -> cannot vote; backdate it
  await asBob(async () => {
    await rejects(() => db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('gym', $1)`, [gymId]), /too new/);
  });
  await db.exec(`update auth.users set created_at = now() - interval '3 days'`);
  await asBob(async () => {
    await db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('gym', $1)`, [gymId]);
    await rejects(() => db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('gym', $1)`, [gymId])); // one per month
    await rejects(() => db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('coach', $1)`, [gymId]), /mismatch/);
  });
  await asAlice(async () => {
    await rejects(() => db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('gym', $1)`, [gymId]), /own organization/);
  });
  await asAnon(async () => {
    const r = (await db.query(`select * from public.get_vote_results('gym')`)).rows;
    assert.equal(r.length, 1);
    assert.equal(Number(r[0].votes), 1);
    await rejects(() => db.query(`insert into public.monthly_votes (category, nominee_org_id) values ('gym', $1)`, [gymId]));
  });
  // streak: two weeks with 2 visits each
  const org = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  const m = (await db.query(`select id, access_token from public.org_members where organization_id = $1 order by created_at limit 1`, [org])).rows[0];
  await db.exec(`delete from public.member_checkins where member_id = '${m.id}'`);
  for (const h of [7 * 24 - 22, 7 * 24 - 46, 14 * 24 - 22, 14 * 24 - 46]) { // two visits in each of the 2 previous weeks (Jordan time)
    await db.query(`insert into public.member_checkins (organization_id, member_id, checked_in_at)
      values ($1, $2, (date_trunc('week', now() at time zone 'Asia/Amman') + ($3 || ' hours')::interval) at time zone 'Asia/Amman' - interval '7 days' + interval '0 hours')`, [org, m.id, String(h - 7 * 24 + 7 * 24)]);
  }
  await asAnon(async () => {
    const r = (await db.query(`select * from public.get_member_streak($1)`, [m.access_token])).rows[0];
    assert.equal(Number(r.total_visits), 4);
    assert.equal(Number(r.best_weeks), 2);
    assert.equal(Number(r.streak_weeks), 2);
  });
});

test("nutritionist can partner with several gyms", async () => {
  const gym1 = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  let nut, gym2;
  await asBob(async () => {
    nut = (await db.query(`insert into public.organizations (type, slug, name_ar, created_by) values ('nutritionist', 'nut-partner', 'أخصائي شريك', $1) returning id`, [BOB])).rows[0].id;
    await rejects(() => db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id) values ($1, $2)`, [gym1, nut]), /incomplete/);
    await db.query(`insert into public.coach_profiles (organization_id, experience_years, education, specialties) values ($1, 4, 'ماجستير تغذية', 'تنزيل وزن، تغذية رياضية')`, [nut]);
  });
  await db.query(`insert into public.organization_media (organization_id, storage_path) values ($1, $2)`, [nut, `${nut}/p.jpg`]);
  await asAdmin(async () => { await db.exec(`update public.organizations set status = 'published' where id = '${nut}'`); });
  await asAdmin(async () => {
    gym2 = (await db.query(`insert into public.organizations (type, slug, name_ar, created_by) values ('gym', 'cg-gym-2', 'نادي ثاني', $1) returning id`, [ADMIN])).rows[0].id;
  });
  await asAdmin(async () => { await db.exec(`update public.organizations set status = 'published' where id = '${gym2}'`); });
  let l1, l2;
  await asBob(async () => {
    l1 = (await db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id) values ($1, $2) returning id`, [gym1, nut])).rows[0].id;
    l2 = (await db.query(`insert into public.coach_gym_links (gym_org_id, coach_org_id) values ($1, $2) returning id`, [gym2, nut])).rows[0].id;
  });
  await asAlice(async () => { await db.query(`update public.coach_gym_links set status = 'approved' where id = $1`, [l1]); });
  await asAdmin(async () => { await db.query(`update public.coach_gym_links set status = 'approved' where id = $1`, [l2]); });
  await asAnon(async () => {
    const a = (await db.query(`select partner_type, coach_slug from public.get_gym_partners($1)`, [gym1])).rows;
    assert.deepEqual(a.map((r) => r.partner_type), ["nutritionist"]);
    assert.equal((await db.query(`select * from public.get_coach_gyms($1)`, [nut])).rows.length, 2);
  });
});

test("monetization: codes hide the code, reveals counted; market guards; stats; leads", async () => {
  const gym = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  let codeId;
  await asAlice(async () => {
    codeId = (await db.query(`insert into public.offer_codes (organization_id, title_ar, code, reveals) values ($1, 'خصم 15%', 'JGR15', 99) returning id`, [gym])).rows[0].id;
    assert.equal((await db.query(`select reveals from public.offer_codes where id = $1`, [codeId])).rows[0].reveals, 0);
    await rejects(() => db.query(`insert into public.offer_codes (organization_id, title_ar, code) values ($1, 'سيء', 'bad code!')`, [gym]));
  });
  await asBob(async () => {
    assert.equal((await db.query(`select id from public.offer_codes`)).rows.length, 0);
  });
  await asAnon(async () => {
    const list = (await db.query(`select * from public.list_public_codes()`)).rows;
    assert.equal(list.length, 1);
    assert.equal(Object.keys(list[0]).includes("code"), false);
    assert.equal((await db.query(`select public.reveal_offer_code($1) as c`, [codeId])).rows[0].c, "JGR15");
    assert.equal((await db.query(`select code from public.offer_codes`).catch(() => ({ rows: [] }))).rows.length, 0);
    const s = (await db.query(`select * from public.get_public_stats()`)).rows[0];
    assert.ok(Number(s.orgs) >= 1);
    assert.equal((await db.query(`select public.submit_sponsor_lead('شركة', 'ش', '+962790000000', 'راعي', 'اهلا') as ok`)).rows[0].ok, true);
    assert.equal((await db.query(`select * from public.sponsor_leads`).catch(() => ({ rows: [] }))).rows.length, 0);
  });
  await asAlice(async () => {
    assert.equal(Number((await db.query(`select reveals from public.offer_codes where id = $1`, [codeId])).rows[0].reveals), 1);
    const id = (await db.query(`insert into public.equipment_listings (organization_id, title_ar, condition, kind, price_jod) values ($1, 'جهاز جري', 'used', 'sale', 250) returning id`, [gym])).rows[0].id;
    await rejects(() => db.query(`insert into public.equipment_listings (organization_id, title_ar, condition, kind) values ($1, 'بدون سعر', 'used', 'sale')`, [gym]));
    await db.query(`insert into public.equipment_listings (organization_id, title_ar, condition, kind, swap_for) values ($1, 'بدلة', 'like_new', 'swap', 'بار أولمبي')`, [gym]);
    await rejects(() => db.query(`update public.equipment_listings set status = 'removed' where id = $1`, [id]), /only the platform/);
    await db.query(`update public.equipment_listings set expires_at = now() + interval '400 days' where id = $1`, [id]);
    assert.ok(new Date((await db.query(`select expires_at from public.equipment_listings where id = $1`, [id])).rows[0].expires_at) < new Date(Date.now() + 31 * 86400000));
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.equipment_listings`)).rows.length, 2);
    const id = (await db.query(`select id from public.equipment_listings limit 1`)).rows[0].id;
    assert.equal((await db.query(`select public.report_equipment($1, 'مشبوه') as ok`, [id])).rows[0].ok, true);
  });
  await asAdmin(async () => {
    await db.query(`update public.equipment_listings set status = 'removed' where title_ar = 'بدلة'`);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.equipment_listings`)).rows.length, 1);
  });
  // a store / non-published org cannot list; facility ok
  const draft = (await db.query(`select id from public.organizations where slug = 'nutri-test'`)).rows[0].id;
  await asAlice(async () => {
    await rejects(() => db.query(`insert into public.equipment_listings (organization_id, title_ar, condition, kind, price_jod) values ($1, 'غلط', 'used', 'sale', 5)`, [draft]));
  });
});

test("videos: reviews are admin-only, reels pending until approved, link allow-list", async () => {
  const gym = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  let reelId;
  await asAlice(async () => {
    await rejects(() => db.query(`insert into public.videos (organization_id, kind, url) values ($1, 'review', 'https://youtu.be/abcdefghijk')`, [gym]), /platform only/);
    await rejects(() => db.query(`insert into public.videos (organization_id, kind, url) values ($1, 'reel', 'https://evil.example.com/x')`, [gym]), /unsupported/);
    reelId = (await db.query(`insert into public.videos (organization_id, kind, url, status, views) values ($1, 'reel', 'https://www.tiktok.com/@a/video/123', 'approved', 50) returning id`, [gym])).rows[0].id;
    const r = (await db.query(`select status, views, platform from public.videos where id = $1`, [reelId])).rows[0];
    assert.deepEqual([r.status, Number(r.views), r.platform], ["pending", 0, "tiktok"]);
    await db.query(`update public.videos set status = 'approved' where id = $1`, [reelId]);
    assert.equal((await db.query(`select status from public.videos where id = $1`, [reelId])).rows[0].status, "pending");
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.videos`)).rows.length, 0);
  });
  await asAdmin(async () => {
    await db.query(`update public.videos set status = 'approved' where id = $1`, [reelId]);
    await db.query(`insert into public.videos (organization_id, kind, url, status, title_ar) values ($1, 'review', 'https://www.instagram.com/reel/AbC123/', 'approved', 'مراجعة')`, [gym]);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.videos`)).rows.length, 2);
    await db.query(`select public.count_video_view($1)`, [reelId]);
    assert.equal((await db.query(`select public.report_video($1, 'سبام') as ok`, [reelId])).rows[0].ok, true);
    assert.equal((await db.query(`select * from public.video_reports`).catch(() => ({ rows: [] }))).rows.length, 0);
  });
  await asAlice(async () => {
    assert.equal(Number((await db.query(`select views from public.videos where id = $1`, [reelId])).rows[0].views), 1);
    await db.query(`delete from public.videos where id = $1`, [reelId]);
  });
});

test("exercises: admin-only list, coach explanations are pending until approved, link allow-list, limits", async () => {
  const coach = (await db.query(`select id from public.organizations where slug = 'cg-coach'`)).rows[0].id;
  const gym = (await db.query(`select id from public.organizations where slug = 'cg-gym'`)).rows[0].id;
  const ex = (await db.query(`select id from public.exercises where slug = 'squat'`)).rows[0].id;
  assert.ok((await db.query(`select count(*)::int n from public.exercises`)).rows[0].n >= 30);
  let expl;
  await asBob(async () => {
    await rejects(() => db.query(`insert into public.exercises (slug, name_ar, muscle_group) values ('x-ex', 'تمرين', 'abs')`));
    await rejects(() => db.query(`insert into public.exercise_explanations (exercise_id, organization_id, steps_ar) values ($1, $2, array['خ'])`, [ex, coach]), /invalid step/);
    await rejects(() => db.query(`insert into public.exercise_explanations (exercise_id, organization_id, video_url, steps_ar) values ($1, $2, 'https://evil.example.com/x', array['خطوة اولى'])`, [ex, coach]), /unsupported/);
    expl = (await db.query(`insert into public.exercise_explanations (exercise_id, organization_id, video_url, steps_ar, mistake_ar, status) values ($1, $2, 'https://youtu.be/abcdefghijk', array['خطوة اولى','خطوة ثانية'], 'خطأ شائع', 'approved') returning id`, [ex, coach])).rows[0].id;
    assert.equal((await db.query(`select status, platform from public.exercise_explanations where id = $1`, [expl])).rows[0].status, "pending");
    await rejects(() => db.query(`insert into public.exercise_explanations (exercise_id, organization_id, steps_ar) values ($1, $2, array['خطوة اولى'])`, [ex, coach])); // one per exercise per coach
    await db.query(`update public.exercise_explanations set status = 'approved' where id = $1`, [expl]);
    assert.equal((await db.query(`select status from public.exercise_explanations where id = $1`, [expl])).rows[0].status, "pending");
  });
  await asAlice(async () => {
    // a gym (not an independent coach) cannot write explanations
    await rejects(() => db.query(`insert into public.exercise_explanations (exercise_id, organization_id, steps_ar) values ($1, $2, array['خطوة اولى'])`, [ex, gym]), /only coaches/);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.exercise_explanations`)).rows.length, 0);
    assert.ok((await db.query(`select id from public.exercises`)).rows.length >= 30);
  });
  await asAdmin(async () => {
    await db.query(`update public.exercise_explanations set status = 'approved' where id = $1`, [expl]);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.exercise_explanations`)).rows.length, 1);
  });
  await asBob(async () => {
    // editing steps sends it back to review
    await db.query(`update public.exercise_explanations set steps_ar = array['خطوة جديدة','وخطوة ثانية'] where id = $1`, [expl]);
    assert.equal((await db.query(`select status from public.exercise_explanations where id = $1`, [expl])).rows[0].status, "pending");
  });
  await asAdmin(async () => {
    await db.query(`update public.exercises set is_active = false where id = $1`, [ex]);
    await db.query(`update public.exercise_explanations set status = 'approved' where id = $1`, [expl]);
  });
  await asAnon(async () => {
    assert.equal((await db.query(`select id from public.exercise_explanations`)).rows.length, 0); // inactive exercise hides explanations
  });
  await asAdmin(async () => { await db.query(`update public.exercises set is_active = true where id = $1`, [ex]); });
});
