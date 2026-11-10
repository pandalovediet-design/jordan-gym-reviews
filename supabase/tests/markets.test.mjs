// Markets (countries / cities / country managers). Run: npm run test:db
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const OWNER = "00000000-0000-4000-8000-00000000000a";
const JO_MANAGER = "00000000-0000-4000-8000-0000000000b1";
const SA_MANAGER = "00000000-0000-4000-8000-0000000000b2";
const ADMIN = "00000000-0000-4000-8000-0000000000ad";

let db;
const ctx = {};

async function as(role, uid, fn) {
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [uid ? JSON.stringify({ sub: uid, role }) : ""]);
  await db.exec(`set role ${role}`);
  try { return await fn(); } finally { await db.exec("reset role"); }
}
const asUser = (uid, fn) => as("authenticated", uid, fn);
const asAnon = (fn) => as("anon", null, fn);

before(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(readFileSync(new URL("./stubs.sql", import.meta.url), "utf8"));
  const dir = new URL("../migrations/", import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(new URL(file, dir), "utf8"));
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${OWNER}', 'owner@test.invalid'), ('${JO_MANAGER}', 'jo@test.invalid'),
      ('${SA_MANAGER}', 'sa@test.invalid'), ('${ADMIN}', 'admin@test.invalid');
    insert into public.platform_admins (user_id) values ('${ADMIN}');
    insert into public.country_managers (user_id, country_code) values ('${JO_MANAGER}', 'JO'), ('${SA_MANAGER}', 'SA');
  `);
});

test("the migration is safe to run twice", async () => {
  const dir = new URL("../migrations/", import.meta.url);
  await db.exec(readFileSync(new URL("20261110090000_markets_foundation.sql", dir), "utf8"));
  await db.exec(readFileSync(new URL("20261110120000_markets_admin_ads.sql", dir), "utf8"));
});

test("the public sees only active markets and their cities", async () => {
  await asAnon(async () => {
    const c = await db.query(`select code from public.countries order by code`);
    assert.deepEqual(c.rows.map((r) => r.code), ["JO"]);
    const cities = await db.query(`select count(*)::int as n from public.cities`);
    assert.equal(cities.rows[0].n, 12);
  });
});

test("a new organization lands in Jordan and its city is linked automatically", async () => {
  await asUser(OWNER, async () => {
    const r = await db.query(
      `insert into public.organizations (type, slug, name_ar, city, created_by)
       values ('gym', 'owner-gym', 'نادي المالك', 'إربد', $1) returning id, country_code, city_id, status`, [OWNER]);
    ctx.gym = r.rows[0].id;
    assert.equal(r.rows[0].country_code, "JO");
    assert.equal(r.rows[0].status, "draft");
    const city = await db.query(`select slug from public.cities where id = $1`, [r.rows[0].city_id]);
    assert.equal(city.rows[0].slug, "irbid");
  });
});

test("owners cannot register in a closed market or move their organization to another one", async () => {
  await asUser(OWNER, async () => {
    await assert.rejects(() => db.query(
      `insert into public.organizations (type, slug, name_ar, country_code, created_by)
       values ('gym', 'owner-sa', 'نادي بالسعودية', 'SA', $1)`, [OWNER]));
    await db.query(`update public.organizations set country_code = 'SA' where id = $1`, [ctx.gym]);
    const r = await db.query(`select country_code from public.organizations where id = $1`, [ctx.gym]);
    assert.equal(r.rows[0].country_code, "JO");
    await assert.rejects(() => db.query(`update public.organizations set status = 'published' where id = $1`, [ctx.gym]));
  });
});

test("a country manager sees and approves organizations in their own market only", async () => {
  await asUser(SA_MANAGER, async () => {
    const seen = await db.query(`select id from public.organizations where id = $1`, [ctx.gym]);
    assert.equal(seen.rows.length, 0);
    const upd = await db.query(`update public.organizations set status = 'published' where id = $1`, [ctx.gym]);
    assert.equal(upd.affectedRows, 0);
  });
  await asUser(JO_MANAGER, async () => {
    const seen = await db.query(`select status from public.organizations where id = $1`, [ctx.gym]);
    assert.equal(seen.rows[0].status, "draft");
    await db.query(`update public.organizations set status = 'published' where id = $1`, [ctx.gym]);
  });
  await asAnon(async () => {
    const r = await db.query(`select status from public.organizations where id = $1`, [ctx.gym]);
    assert.equal(r.rows[0].status, "published");
  });
});

test("a country manager cannot grant the verified badge, move markets, or make themselves a manager elsewhere", async () => {
  await asUser(JO_MANAGER, async () => {
    await db.query(`update public.organizations set verified_at = now(), country_code = 'SA' where id = $1`, [ctx.gym]);
    await assert.rejects(() => db.query(`insert into public.country_managers (user_id, country_code) values ($1, 'SA')`, [JO_MANAGER]));
    const mine = await db.query(`select country_code from public.country_managers`);
    assert.deepEqual(mine.rows.map((r) => r.country_code), ["JO"]);
  });
  const r = await db.query(`select verified_at, country_code from public.organizations where id = $1`, [ctx.gym]);
  assert.equal(r.rows[0].verified_at, null);
  assert.equal(r.rows[0].country_code, "JO");
});

test("only the platform admin appoints country managers, by e-mail", async () => {
  await asUser(OWNER, async () => {
    await assert.rejects(() => db.query(`select public.set_country_manager('owner@test.invalid', 'JO', true)`));
    await assert.rejects(() => db.query(`select * from public.list_country_managers()`));
  });
  await asUser(ADMIN, async () => {
    const miss = await db.query(`select public.set_country_manager('nobody@test.invalid', 'JO', true) as r`);
    assert.equal(miss.rows[0].r, "no_user");
    const ok = await db.query(`select public.set_country_manager('OWNER@test.invalid', 'EG', true) as r`);
    assert.equal(ok.rows[0].r, "ok");
    const list = await db.query(`select email, country_code from public.list_country_managers() where country_code = 'EG'`);
    assert.deepEqual(list.rows, [{ email: "owner@test.invalid", country_code: "EG" }]);
    await db.query(`select public.set_country_manager('owner@test.invalid', 'EG', false)`);
  });
});

test("ad impressions: visitors can only add one view to live ads", async () => {
  await asUser(ADMIN, async () => {
    const r = await db.query(
      `insert into public.ads (placement, title, link_url, starts_at, ends_at) values
         ('banner', 'إعلان شغّال', 'https://example.com', now() - interval '1 day', now() + interval '1 day'),
         ('banner', 'إعلان منتهي', 'https://example.com', now() - interval '3 day', now() - interval '1 day')
       returning id, country_code`);
    ctx.live = r.rows[0].id; ctx.ended = r.rows[1].id;
    assert.equal(r.rows[0].country_code, "JO");
  });
  await asAnon(async () => {
    await db.query(`select public.count_ad_impressions($1::uuid[])`, [[ctx.live, ctx.live, ctx.ended]]);
    await assert.rejects(() => db.query(`update public.ads set impressions = 999 where id = $1 returning id`, [ctx.live]).then((x) => { if (x.affectedRows === 0) throw new Error("blocked"); }));
  });
  const r = await db.query(`select title, impressions from public.ads where id = any($1::uuid[]) order by title`, [[ctx.live, ctx.ended]]);
  assert.deepEqual(r.rows.map((x) => x.impressions).sort(), [0, 1]);
});
