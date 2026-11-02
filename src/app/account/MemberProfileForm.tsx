"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MemberProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    const clean = name.trim();
    if (!clean) { setMessage("اكتب الاسم أولاً."); return; }
    if (clean.length > 60) { setMessage("الاسم طويل أكثر من اللازم."); return; }
    setBusy(true); setMessage("");
    const { error } = await createClient().auth.updateUser({ data: { full_name: clean } });
    setBusy(false);
    if (error) { setMessage("ما قدرنا نحفظ الاسم. جرّب مرة ثانية."); return; }
    setSavedName(clean);
    setMessage("تم حفظ اسمك بنجاح.");
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5">
      <div className="mb-3"><h2 className="font-black">بياناتك الشخصية</h2><p className="mt-1 text-sm text-muted">الاسم الذي يظهر في حسابك.</p></div>
      <label htmlFor="member-name" className="mb-2 block text-sm font-bold">الاسم</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="member-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="name" className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-background px-4 outline-none focus:border-accent" />
        <button type="button" onClick={save} disabled={busy || name.trim() === savedName} className="min-h-12 rounded-xl bg-accent px-5 font-black text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50">{busy ? "جارٍ الحفظ…" : "حفظ الاسم"}</button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted">{message}</p>
    </div>
  );
}
