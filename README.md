# Velvet & Oak — Salon Website + Admin Dashboard

React + TypeScript + Vite + Tailwind + Supabase. Builds and typechecks clean
(`npm run build` verified).

## What's fully working (real backend, no fake functionality)

**Public site:** Home, Services (with category filters, live from Supabase),
Our Stylists, Gallery (category filters), Contact (form writes to
`contact_messages`), and a full multi-step **Booking flow**: service →
stylist → date/time → details → confirmation. Availability is computed from
each stylist's `staff_availability` and existing appointments, and a
Postgres **exclusion constraint** (`no_overlapping_staff_appointments` in
`0001_init.sql`) makes double-booking impossible at the database level, not
just in the UI — so it's safe even under concurrent bookings.

**Admin — complete:** Real Supabase Auth login at `/admin/login`, route
protection via `profiles.role = 'admin'` (checked server-side through RLS,
not just hidden in the frontend), and every dashboard section wired to the
real backend:
- **Dashboard** — live counts and recent bookings
- **Appointments** — filter by date/status, search, change status
- **Services** — add/edit/delete/disable, category assignment, image upload
  to Storage (`service-images` bucket)
- **Staff** — add/edit/deactivate/delete, photo upload, per-day working
  hours editor that writes to `staff_availability`
- **Gallery** — upload, categorize, caption, feature, delete (`gallery`
  bucket), with storage cleanup on delete
- **Testimonials** — add/edit/delete/publish toggle
- **Customers** — search, appointment count + last visit computed from real
  data, per-customer appointment history
- **Messages** — read/unread, delete
- **Settings** — business info + logo upload, per-day opening hours,
  min notice / max advance booking rules, all persisted to `salon_settings`

**Database:** Complete schema in `supabase/migrations/0001_init.sql` — every
table from the spec (profiles, services, service_categories, staff,
staff_availability, customers, appointments, gallery, testimonials,
contact_messages, salon_settings), UUID primary keys, indexes on the fields
called out in the brief, RLS enabled and policy-scoped on every table
(customers/appointments are not publicly readable — only insertable, so the
booking flow can't leak anyone else's data), and storage buckets +
policies for gallery/staff/service images. `0002_seed.sql` has realistic
Indian sample data (₹ pricing, Mumbai salon).

Builds and typechecks clean (`npm run build` verified after every phase).

## Known limitations / good next steps

- **Pagination:** Appointments and Customers currently fetch up to 100–200
  rows; for a salon with heavy volume, add cursor/offset pagination.
- **SEO extras:** Open Graph tags and the base meta description are in
  `index.html`; per-page titles, JSON-LD `LocalBusiness` schema, and a
  sitemap/robots.txt aren't wired up yet.
- **Booking reminders/notifications:** No email/SMS confirmation is sent on
  booking — appointments land as `pending` for staff to confirm manually.
  Adding this needs a Supabase Edge Function + an email/SMS provider.
- **Testing:** No automated tests included. I'd recommend at least a
  Playwright smoke test for the booking flow before going live, given the
  double-booking constraint is the one thing that must never regress.



```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
```

In your Supabase project (SQL editor or `supabase db push`):
1. Enable Storage in the dashboard first.
2. Run `supabase/migrations/0001_init.sql`.
3. Run `supabase/migrations/0002_seed.sql` (optional sample data).
4. Create your first admin user: sign them up via Supabase Auth (dashboard
   → Authentication → Add user), then insert their profile:
   ```sql
   insert into profiles (id, full_name, role)
   values ('<the auth.users id>', 'Your Name', 'admin');
   ```

```bash
npm run dev
```

## Project structure

```
src/
  components/   shared UI (Navbar, Footer, ServiceCard, StaffCard, etc.)
  pages/        public pages
  layouts/      PublicLayout
  hooks/        usePublicData.ts — data fetching hooks
  contexts/     AuthContext.tsx
  lib/          supabase.ts client
  types/        shared TypeScript interfaces
  utils/        booking.ts — slot calculation + booking submission
  admin/        AdminLayout, Sidebar, ProtectedRoute, pages/
supabase/migrations/
  0001_init.sql   schema, indexes, RLS, storage policies
  0002_seed.sql   sample data
```

## Notes on the design

Palette and type are a deliberate choice for this brief, not defaults:
ink (#1B1815), parchment (#F7F2EA), champagne (#C9A66B) and rosewood
(#8C4A3D) — set in `tailwind.config.js`. Display type is Fraunces (serif),
body is Work Sans. `prefers-reduced-motion` is respected globally in
`index.css`.
# salon
