"use client";
import { useState } from "react";
import { field } from "@/components/Form";

type Cat = { id: string; org_type: string; name_ar: string };

/** Type + category selects: the category list follows the chosen type. */
export function CategoryPicker({ types, categories }: { types: Record<string, string>; categories: Cat[] }) {
  const [type, setType] = useState(Object.keys(types)[0]);
  const options = categories.filter((c) => c.org_type === type);
  return (
    <>
      <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={field}>
        {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <select name="category_id" required key={type} defaultValue="" className={field}>
        <option value="" disabled>اختر التصنيف</option>
        {options.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
      </select>
    </>
  );
}
