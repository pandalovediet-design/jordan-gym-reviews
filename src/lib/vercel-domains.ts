import "server-only";

// Thin wrapper over the Vercel REST API for custom domains. Needs VERCEL_API_TOKEN and VERCEL_PROJECT_ID
// (and VERCEL_TEAM_ID when the project belongs to a team). Without them the feature stays disabled.
const API = "https://api.vercel.com";

export const domainsEnabled = () => !!process.env.VERCEL_API_TOKEN && !!process.env.VERCEL_PROJECT_ID;

type Verification = { type: string; domain: string; value: string; reason?: string };
export type DomainInfo = { verified: boolean; verification: Verification[]; misconfigured?: boolean };

function url(path: string) {
  const u = new URL(`${API}${path}`);
  if (process.env.VERCEL_TEAM_ID) u.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  return u.toString();
}
async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(url(path), {
    ...init,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { code?: string; message?: string } };
  return { ok: res.ok, status: res.status, body };
}
const project = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID!);

export async function addDomain(domain: string): Promise<{ ok: true; info: DomainInfo } | { ok: false; code: string }> {
  const r = await call(`/v10/projects/${project()}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!r.ok) return { ok: false, code: r.body.error?.code ?? `http_${r.status}` };
  return { ok: true, info: { verified: !!r.body.verified, verification: (r.body.verification as Verification[]) ?? [] } };
}

export async function checkDomain(domain: string): Promise<DomainInfo | null> {
  const v = await call(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}/verify`, { method: "POST" });
  if (!v.ok) return null;
  const cfg = await call(`/v6/domains/${encodeURIComponent(domain)}/config`);
  return {
    verified: !!v.body.verified,
    verification: (v.body.verification as Verification[]) ?? [],
    misconfigured: cfg.ok ? !!cfg.body.misconfigured : undefined,
  };
}

export async function removeDomain(domain: string): Promise<void> {
  await call(`/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`, { method: "DELETE" });
}
