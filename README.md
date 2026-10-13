# DriveWise

Driving-school booking app. Students book lessons with instructors in their own car and pay after each class; instructors manage their schedule, appointments and (anonymous) feedback; admins manage instructors, see all bookings and feedback, and restyle the whole site from the **Studio**.

Built with Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion and Supabase (Postgres, Auth, Storage).

## Roles

| Role | Lands on | Can |
| --- | --- | --- |
| Student (`customer`) | `/customer` | Browse instructors and ratings, book single classes or 10-class packages, cancel, rate completed lessons |
| Instructor | `/instructor` | Set weekly availability, see and complete appointments, record payments, read anonymous feedback |
| Admin | `/admin` | Overview of all bookings, add/edit/deactivate instructors, read and moderate all feedback (with author), change the site look in Studio |

Everyone signs in at `/login`. Instructors created by an admin get a temporary password and must choose their own on first login.

## Setup

1. **Install**

   ```bash
   npm install
   cp .env.example .env.local   # then fill in the values
   ```

2. **Database.** Open Supabase → SQL Editor and run every file in [`supabase/migrations/`](supabase/migrations) in order. The migration is idempotent (safe to re-run) and adds:
   - extra instructor fields and soft-delete (`active`)
   - `feedback` table, the anonymous `instructor_feedback` view, public `instructor_ratings` and `public_reviews` views
   - `site_settings` (Studio) and the `site-assets` storage bucket
   - row-level security so only admins can change settings, manage instructors or see who wrote feedback

3. **Make yourself admin** (once):

   ```sql
   update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
   ```

4. **Run**

   ```bash
   npm run dev
   ```

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public anon key (RLS enforces access) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Lets admins create instructor logins. Never expose it or prefix it with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | client + server | Canonical URL for SEO, share images and the sitemap |

## Deploying to Vercel

1. Import the GitHub repo in Vercel (framework preset: Next.js).
2. Add the four environment variables above for Production (and Preview if you use it).
3. In Supabase → Authentication → URL Configuration, set **Site URL** to your domain and add `https://your-domain.com/auth/callback` and `https://your-domain.com/reset-password` to the redirect URLs. Do the same in the Google OAuth provider settings if Google sign-in is enabled.
4. Deploy. `npm run build` and `npm run lint` must pass locally first.

The GitHub Action in `.github/workflows/keep-supabase-alive.yml` pings the database every 3 days so a free-tier project doesn't pause. It needs `SUPABASE_URL` and `SUPABASE_ANON_KEY` repository secrets.

## Studio (admin → Studio)

Changes preview live for the admin only; **Publish** makes them live for everyone immediately (the cached settings are invalidated via `updateTag`).

- Presets: Midnight Gold (default), Racing Red, Daylight. Visitors can flip to the light theme with the sun/moon button.
- Accent colour, corner style, background (glow / grid / road lines / none)
- Motion: intensity (off / subtle / playful), speed, and toggles for scroll animations (steering wheel, road car, journey), hover effects and page transitions. Visitors with "reduce motion" enabled always get a static site.
- Branding: site name, tagline, logo and favicon uploads
- Business: price per class and footer contact details

## Project structure

```
app/
  actions/            server actions (publish settings, create instructor)
  admin/_components/  Overview, Instructors, Feedback and Studio panels
  components/         shell (Navbar, Footer, Background, ScrollRoad), home sections, ui kit
  customer/ instructor/ profile/ login/ signup/ …  routes
lib/
  theme.ts            presets, settings schema and validation
  motion.ts           motion profile hook used by every animation
  siteSettings.ts     cached server read of published settings
  supabaseClient.ts / supabaseServer.ts
supabase/migrations/  SQL to apply in Supabase
```
