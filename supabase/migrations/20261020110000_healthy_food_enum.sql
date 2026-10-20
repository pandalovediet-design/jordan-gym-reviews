-- New organization type (kept in its own migration: a new enum value cannot be used in the same transaction).
alter type public.org_type add value if not exists 'healthy_food';
