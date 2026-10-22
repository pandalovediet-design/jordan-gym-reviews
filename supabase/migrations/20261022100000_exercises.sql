-- Exercise guide: canonical exercises (platform-controlled) + explanations written by independent coaches (admin-approved).
-- Additive only.

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name_ar text not null check (char_length(name_ar) between 2 and 60),
  muscle_group text not null check (muscle_group in ('chest','shoulders','biceps','triceps','forearms','abs','back','glutes','quads','hamstrings','calves')),
  secondary_ar text check (char_length(secondary_ar) <= 80),
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  gear_ar text check (char_length(gear_ar) <= 60),
  summary_ar text check (char_length(summary_ar) <= 300),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create index exercises_group_idx on public.exercises (muscle_group, sort_order);

alter table public.exercises enable row level security;
create policy exercises_public_read on public.exercises for select to anon, authenticated using (is_active);
create policy exercises_admin on public.exercises for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.exercises to anon;
grant select, insert, update, delete on public.exercises to authenticated;

create table public.exercise_explanations (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  video_url text check (video_url is null or (char_length(video_url) <= 300 and video_url ~ '^https://')),
  platform text check (platform in ('youtube', 'instagram', 'tiktok', 'facebook')),
  steps_ar text[] not null check (cardinality(steps_ar) between 1 and 8),
  mistake_ar text check (char_length(mistake_ar) <= 200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (exercise_id, organization_id)
);
create index exercise_explanations_org_idx on public.exercise_explanations (organization_id);
create index exercise_explanations_public_idx on public.exercise_explanations (exercise_id, status);
create trigger exercise_explanations_lock_org before update on public.exercise_explanations
  for each row execute function public.lock_organization_id();

create function public.exercise_explanations_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  host text;
  s text;
begin
  if tg_op = 'INSERT' then
    if public.org_type_of(new.organization_id) <> 'independent_coach' and not public.is_platform_admin() then
      raise exception 'only coaches can explain exercises' using errcode = '42501';
    end if;
    if (select count(*) from public.exercise_explanations where organization_id = new.organization_id) >= 20
       and not public.is_platform_admin() then
      raise exception 'too many explanations' using errcode = '23514';
    end if;
  end if;
  -- video link allow-list (optional link)
  if new.video_url is null then
    new.platform := null;
  else
    host := lower(substring(new.video_url from '^https://([^/?#]+)'));
    host := regexp_replace(coalesce(host, ''), '^(www\.|m\.|vm\.|vt\.)', '');
    new.platform := case
      when host in ('youtube.com', 'youtu.be') then 'youtube'
      when host = 'instagram.com' then 'instagram'
      when host = 'tiktok.com' then 'tiktok'
      when host in ('facebook.com', 'fb.watch') then 'facebook'
      else null end;
    if new.platform is null then raise exception 'unsupported video link' using errcode = '23514'; end if;
  end if;
  -- each step is a short line
  foreach s in array new.steps_ar loop
    if char_length(btrim(s)) not between 2 and 200 then
      raise exception 'invalid step' using errcode = '23514';
    end if;
  end loop;
  if not public.is_platform_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
    else
      -- any content change by the coach goes back to review
      new.status := case
        when new.video_url is distinct from old.video_url
          or new.steps_ar is distinct from old.steps_ar
          or new.mistake_ar is distinct from old.mistake_ar
        then 'pending' else old.status end;
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.exercise_explanations_guard() from public, anon, authenticated;
create trigger exercise_explanations_guard_trg before insert or update on public.exercise_explanations
  for each row execute function public.exercise_explanations_guard();

alter table public.exercise_explanations enable row level security;
create policy explanations_public_read on public.exercise_explanations for select to anon, authenticated
  using (status = 'approved' and public.org_is_published(organization_id)
         and exists (select 1 from public.exercises e where e.id = exercise_id and e.is_active));
create policy explanations_member_rw on public.exercise_explanations for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy explanations_admin on public.exercise_explanations for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.exercise_explanations to anon;
grant select, insert, update, delete on public.exercise_explanations to authenticated;

-- ------------------------------------------------------------------ starter list (admin edits it later)
insert into public.exercises (slug, name_ar, muscle_group, secondary_ar, level, gear_ar, summary_ar, sort_order) values
  ('dumbbell-bench-press', 'ضغط الدمبل للصدر', 'chest', 'الأكتاف الأمامية، الترايسبس', 'beginner', 'دمبل + بنش', 'تمرين أساسي لبناء عضلة الصدر بمدى حركة أوسع من البار.', 10),
  ('push-up', 'تمرين الضغط', 'chest', 'الترايسبس، البطن', 'beginner', 'بدون معدات', 'تمرين بوزن الجسم يشتغل الصدر والذراعين والجذع.', 20),
  ('incline-dumbbell-press', 'ضغط دمبل مائل', 'chest', 'الأكتاف الأمامية', 'intermediate', 'دمبل + بنش مائل', 'يركّز على الجزء العلوي من الصدر.', 30),
  ('cable-fly', 'فلاي الكيبل', 'chest', 'الأكتاف الأمامية', 'intermediate', 'جهاز كيبل', 'تمرين عزل للصدر يحافظ على الشد طوال الحركة.', 40),
  ('overhead-press', 'ضغط الأكتاف', 'shoulders', 'الترايسبس', 'intermediate', 'دمبل أو بار', 'التمرين الأساسي لقوة وحجم الأكتاف.', 10),
  ('lateral-raise', 'رفرفة جانبية', 'shoulders', 'الترابيس', 'beginner', 'دمبل', 'يعزل الكتف الجانبي ويعطي عرض للأكتاف.', 20),
  ('face-pull', 'فيس بول', 'shoulders', 'أعلى الظهر', 'beginner', 'كيبل + حبل', 'يقوّي الكتف الخلفي ويحسّن وضعية الكتفين.', 30),
  ('dumbbell-curl', 'كيرل الدمبل', 'biceps', 'الساعد', 'beginner', 'دمبل', 'التمرين الكلاسيكي للبايسبس.', 10),
  ('hammer-curl', 'كيرل المطرقة', 'biceps', 'الساعد، العضلة العضدية', 'beginner', 'دمبل', 'يشتغل البايسبس والساعد بقبضة محايدة.', 20),
  ('barbell-curl', 'كيرل البار', 'biceps', 'الساعد', 'intermediate', 'بار', 'يسمح بوزن أثقل لبناء البايسبس.', 30),
  ('bench-dips', 'غطس الترايسبس', 'triceps', 'الصدر السفلي', 'intermediate', 'بنش أو متوازي', 'تمرين بوزن الجسم للترايسبس.', 10),
  ('triceps-pushdown', 'سحب الترايسبس بالكيبل', 'triceps', '—', 'beginner', 'جهاز كيبل', 'تمرين عزل للترايسبس بحركة سلسة.', 20),
  ('skull-crusher', 'سكل كراشر', 'triceps', '—', 'advanced', 'بار EZ + بنش', 'تمرين قوي للترايسبس، يحتاج تحكّم وتقنية سليمة.', 30),
  ('wrist-curl', 'رفع المعصم بالدمبل', 'forearms', 'قوة القبضة', 'beginner', 'دمبل', 'يقوّي عضلات الساعد وقوة القبضة.', 10),
  ('farmer-walk', 'مشية الفلاح', 'forearms', 'الترابيس، الجذع', 'beginner', 'دمبل ثقيل', 'حمل أوزان ثقيلة والمشي بها لبناء القبضة والثبات.', 20),
  ('plank', 'البلانك', 'abs', 'الكتفين، أسفل الظهر', 'beginner', 'بدون معدات', 'ثبات الجذع وتقوية عضلات البطن العميقة.', 10),
  ('crunch', 'كرنش البطن', 'abs', '—', 'beginner', 'بدون معدات', 'تمرين بسيط لعضلة البطن المستقيمة.', 20),
  ('hanging-leg-raise', 'رفع الأرجل بالتعلّق', 'abs', 'القبضة، ثني الورك', 'advanced', 'بار علوي', 'تمرين متقدم للبطن السفلية.', 30),
  ('dumbbell-row', 'سحب الدمبل', 'back', 'البايسبس', 'intermediate', 'دمبل + بنش', 'يبني عرض وسماكة الظهر من جهة واحدة.', 10),
  ('lat-pulldown', 'سحب أمامي', 'back', 'البايسبس', 'beginner', 'جهاز سحب', 'بديل مناسب للمبتدئين لتمرين العقلة.', 20),
  ('pull-up', 'العقلة', 'back', 'البايسبس، الساعد', 'advanced', 'بار علوي', 'من أقوى تمارين الظهر بوزن الجسم.', 30),
  ('deadlift', 'ديدليفت', 'back', 'المؤخرة، الفخذ الخلفي', 'advanced', 'بار', 'تمرين مركّب لكامل السلسلة الخلفية، يحتاج إشراف مدرب للمبتدئين.', 40),
  ('squat', 'سكوات', 'quads', 'المؤخرة، الفخذ الخلفي', 'intermediate', 'بار أو بدون', 'ملك تمارين الأرجل.', 10),
  ('walking-lunge', 'لانج', 'quads', 'المؤخرة', 'beginner', 'دمبل أو بدون', 'تمرين لكل رجل على حدة يحسّن التوازن.', 20),
  ('leg-press', 'ليج بريس', 'quads', 'المؤخرة', 'beginner', 'جهاز ليج بريس', 'طريقة آمنة لتحميل الفخذين بوزن ثقيل.', 30),
  ('hip-thrust', 'هيب ثرست', 'glutes', 'الفخذ الخلفي', 'intermediate', 'بار + بنش', 'أفضل تمرين لعزل عضلة المؤخرة.', 10),
  ('glute-bridge', 'جسر المؤخرة', 'glutes', 'الفخذ الخلفي', 'beginner', 'بدون معدات', 'نسخة بسيطة بوزن الجسم لتنشيط المؤخرة.', 20),
  ('romanian-deadlift', 'ديدليفت روماني', 'hamstrings', 'المؤخرة، أسفل الظهر', 'intermediate', 'بار أو دمبل', 'يشتغل الفخذ الخلفي بمدى حركة طويل.', 10),
  ('leg-curl', 'ليج كيرل', 'hamstrings', '—', 'beginner', 'جهاز ليج كيرل', 'تمرين عزل للفخذ الخلفي.', 20),
  ('standing-calf-raise', 'رفع السمانة واقفاً', 'calves', '—', 'beginner', 'درجة أو بدون', 'التمرين الأساسي لعضلة السمانة.', 10),
  ('seated-calf-raise', 'رفع السمانة جالساً', 'calves', 'العضلة النعلية', 'beginner', 'جهاز', 'يركّز على العضلة العميقة تحت السمانة.', 20);
