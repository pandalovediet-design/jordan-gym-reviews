/** Jordanian-friendly phone cleanup: 0791234567 / 00962… / +962… → +962…; other valid numbers kept as +digits. */
export function normPhone(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  if (/^0\d{8,9}$/.test(d)) d = "+962" + d.slice(1);
  if (/^962\d{8,9}$/.test(d)) d = "+" + d;
  return /^\+?\d{7,15}$/.test(d) ? d : null;
}

/** The wa.me number for a Jordanian mobile (07x / +9627x), or null when it is a landline or unknown. */
export function waNumber(phone: string | null | undefined): string | null {
  const p = phone ? normPhone(phone) : null;
  return p && /^\+9627[789]\d{7}$/.test(p) ? p.slice(1) : null;
}
