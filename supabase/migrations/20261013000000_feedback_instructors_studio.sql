-- DriveWise: feedback & ratings, richer instructor profiles, and admin-controlled site settings.
-- Run once in the Supabase dashboard (SQL Editor). Safe to re-run: every statement is idempotent.

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- security definer so policies can check the caller's role without recursing into profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Instructors: extra profile details + soft delete
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.instructors
  add column if not exists experience_years integer check (experience_years between 0 and 60),
  add column if not exists languages text[] not null default '{}',
  add column if not exists specialties text[] not null default '{}',
  add column if not exists service_area text,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- Admins manage every instructor row (create, edit details, deactivate/restore).
drop policy if exists "Admins manage instructors" on public.instructors;
create policy "Admins manage instructors" on public.instructors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins can edit any profile (names/phone of instructors they create, role changes).
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Feedback: one rating + comment per completed booking
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  instructor_id uuid not null references public.instructors (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_instructor_idx on public.feedback (instructor_id);

alter table public.feedback enable row level security;

-- Customers see their own feedback; admins see everything (including who wrote it).
drop policy if exists "Read own feedback or admin" on public.feedback;
create policy "Read own feedback or admin" on public.feedback
  for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

-- Admins can remove abusive feedback.
drop policy if exists "Admins delete feedback" on public.feedback;
create policy "Admins delete feedback" on public.feedback
  for delete to authenticated
  using (public.is_admin());

-- Who may leave feedback.
drop policy if exists "Customers leave feedback on completed bookings" on public.feedback;
create policy "Customers leave feedback on completed bookings" on public.feedback
  for insert to authenticated
  with check (
    customer_id = auth.uid()
    and exists (
      select 1
      from public.bookings b
      join public.packages p on p.id = b.package_id
      where b.id = feedback.booking_id
        and b.status = 'completed'
        and p.customer_id = auth.uid()
        and p.instructor_id = feedback.instructor_id
    )
  );

-- Instructors read their feedback through this view, which deliberately has no customer column.
-- Views run with the owner's rights, so the WHERE clause is what limits each instructor to their own rows.
create or replace view public.instructor_feedback as
  select f.id, f.instructor_id, f.rating, f.comment, f.created_at
  from public.feedback f
  join public.instructors i on i.id = f.instructor_id
  where i.profile_id = auth.uid() or public.is_admin();

revoke all on public.instructor_feedback from anon;
grant select on public.instructor_feedback to authenticated;

-- Public aggregate for instructor cards. Exposes only averages and counts.
create or replace view public.instructor_ratings as
  select instructor_id, round(avg(rating)::numeric, 1) as average_rating, count(*)::int as review_count
  from public.feedback
  group by instructor_id;

grant select on public.instructor_ratings to anon, authenticated;

-- Anonymous written reviews for the home page and instructor cards (no customer column).
-- Admins moderate by deleting rows from public.feedback.
create or replace view public.public_reviews as
  select f.id, f.instructor_id, f.rating, f.comment, f.created_at
  from public.feedback f
  where f.comment is not null and char_length(trim(f.comment)) > 0;

grant select on public.public_reviews to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Site settings (Studio): single row, readable by everyone, writable by admins
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Anyone reads site settings" on public.site_settings;
create policy "Anyone reads site settings" on public.site_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage: branding assets bucket + admin access to instructor photos
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "Admins manage site assets" on storage.objects;
create policy "Admins manage site assets" on storage.objects
  for all to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "Admins manage instructor photos" on storage.objects;
create policy "Admins manage instructor photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'instructor-photos' and public.is_admin())
  with check (bucket_id = 'instructor-photos' and public.is_admin());
