"use client";

import { useState } from "react";
import { field } from "@/lib/form-styles";

type Cat = { id: string; org_type: string; name_ar: string };

/** Type + category selects: the category list follows the chosen type. */
export function CategoryPicker({ types, categories }: { types: Record<string, string>; categories: Cat[] }) {
  const [type, setType] = useState(Object.keys(types)[0] ?? "");
  const options = categories.filter((c) => c.org_type === type);

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="org-type" className="text-sm font-bold text-foreground">
          نوع النشاط
        </label>
        <select
          id="org-type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={field}
          required
        >
          {Object.entries(types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="org-category" className="text-sm font-bold text-foreground">
          التصنيف
        </label>
        <select
          id="org-category"
          name="category_id"
          required
          key={type}
          defaultValue=""
          className={field}
          disabled={options.length === 0}
          aria-describedby="org-category-help"
        >
          <option value="" disabled>
            {options.length ? "اختر التصنيف" : "لا توجد تصنيفات لهذا النوع"}
          </option>
          {options.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
        </select>
        <p id="org-category-help" role="status" aria-live="polite" className="text-xs leading-5 text-muted">
          {options.length ? "تتغير التصنيفات تلقائيًا حسب نوع النشاط الذي تختاره." : "لا توجد تصنيفات متاحة لهذا النوع حاليًا. اختر نوعًا آخر للمتابعة."}
        </p>
      </div>
    </div>
  );
}
