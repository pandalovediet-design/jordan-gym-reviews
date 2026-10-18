"use client";
import { useEffect, type ReactNode } from "react";

type Ev = "page_view" | "whatsapp_click" | "phone_click";
function send(organization_id: string, event_type: Ev) {
  try {
    const body = JSON.stringify({ organization_id, event_type });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
    }
  } catch {}
}

export function PageView({ orgId }: { orgId: string }) {
  useEffect(() => send(orgId, "page_view"), [orgId]);
  return null;
}

export function TrackedLink({ orgId, event, href, className, children, external }: {
  orgId: string; event: Ev; href: string; className?: string; children: ReactNode; external?: boolean;
}) {
  return (
    <a href={href} className={className} onClick={() => send(orgId, event)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}
