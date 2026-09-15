-- Velvet & Oak Salon — initial schema
-- Run via: supabase db push  (or paste into the SQL editor in order)

create extension if not exists "uuid-ossp";
create extension if not exists btree_gist; -- needed for the overlap-prevention constraint

-- =========================================================
-- PROFILES  (extends auth.users; role determines admin access)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- =========================================================
-- SERVICE CATEGORIES & SERVICES
-- =========================================================
create table service_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references service_categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  duration_minutes int not null check (duration_minutes > 0),
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_services_category on services(category_id);
create index idx_services_active on services(is_active);

-- =========================================================
-- STAFF & AVAILABILITY
-- =========================================================
create table staff (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  photo_url text,
  bio text not null default '',
  specialization text not null default '',
  experience_years int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_staff_active on staff(is_active);

create table staff_availability (
  id uuid primary key default uuid_generate_v4(),
  staff_id uuid not null references staff(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  is_closed boolean not null default false,
  unique (staff_id, day_of_week)
);

-- =========================================================
-- CUSTOMERS
-- =========================================================
create table customers (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (phone)
);
create index idx_customers_phone on customers(phone);
create index idx_customers_email on customers(email);

-- =========================================================
-- APPOINTMENTS
-- =========================================================
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete restrict,
  service_id uuid not null references services(id) on delete restrict,
  staff_id uuid references staff(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (appointment_date >= current_date or status in ('completed','cancelled','no_show'))
);
create index idx_appointments_date on appointments(appointment_date);
create index idx_appointments_status on appointments(status);
create index idx_appointments_staff on appointments(staff_id);
create index idx_appointments_customer on appointments(customer_id);

-- Server-side double-booking prevention: no two non-cancelled appointments
-- for the same stylist can occupy overlapping time ranges on the same day.
-- This is enforced by Postgres itself, not just application code.
alter table appointments
  add constraint no_overlapping_staff_appointments
  exclude using gist (
    staff_id with =,
    appointment_date with =,
    tsrange(
      (appointment_date + start_time)::timestamp,
      (appointment_date + end_time)::timestamp
    ) with &&
  )
  where (status not in ('cancelled') and staff_id is not null);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_services_updated_at before update on services
  for each row execute function set_updated_at();
create trigger trg_staff_updated_at before update on staff
  for each row execute function set_updated_at();
create trigger trg_appointments_updated_at before update on appointments
  for each row execute function set_updated_at();

-- =========================================================
-- GALLERY
-- =========================================================
create table gallery (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  category text not null default 'Other',
  caption text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_gallery_category on gallery(category);

-- =========================================================
-- TESTIMONIALS
-- =========================================================
create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  review text not null,
  photo_url text,
  review_date date not null default current_date,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_testimonials_published on testimonials(is_published);

-- =========================================================
-- CONTACT MESSAGES
-- =========================================================
create table contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_contact_messages_read on contact_messages(is_read);

-- =========================================================
-- SALON SETTINGS (single row)
-- =========================================================
create table salon_settings (
  id uuid primary key default uuid_generate_v4(),
  salon_name text not null default 'Velvet & Oak Salon',
  logo_url text,
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  google_maps_url text,
  min_booking_notice_hours int not null default 2,
  max_advance_booking_days int not null default 60,
  opening_hours jsonb not null default '[]'::jsonb
);
insert into salon_settings (salon_name, phone, whatsapp, email, address)
values ('Velvet & Oak Salon', '+91 98765 43210', '919876543210', 'hello@velvetoak.in', '12 Linden Road, Bandra West, Mumbai');

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table service_categories enable row level security;
alter table services enable row level security;
alter table staff enable row level security;
alter table staff_availability enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table gallery enable row level security;
alter table testimonials enable row level security;
alter table contact_messages enable row level security;
alter table salon_settings enable row level security;

-- Helper: is the current JWT user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- ---- profiles: a user can read their own row; only admins manage roles ----
create policy "read own profile" on profiles for select using (id = auth.uid());
create policy "admin manage profiles" on profiles for all using (is_admin()) with check (is_admin());

-- ---- service_categories: public read, admin write ----
create policy "public read categories" on service_categories for select using (true);
create policy "admin write categories" on service_categories for insert with check (is_admin());
create policy "admin update categories" on service_categories for update using (is_admin());
create policy "admin delete categories" on service_categories for delete using (is_admin());

-- ---- services: public read active, admin full access ----
create policy "public read active services" on services for select using (is_active or is_admin());
create policy "admin insert services" on services for insert with check (is_admin());
create policy "admin update services" on services for update using (is_admin());
create policy "admin delete services" on services for delete using (is_admin());

-- ---- staff: public read active, admin full access ----
create policy "public read active staff" on staff for select using (is_active or is_admin());
create policy "admin insert staff" on staff for insert with check (is_admin());
create policy "admin update staff" on staff for update using (is_admin());
create policy "admin delete staff" on staff for delete using (is_admin());

-- ---- staff_availability: public read, admin write ----
create policy "public read availability" on staff_availability for select using (true);
create policy "admin write availability" on staff_availability for insert with check (is_admin());
create policy "admin update availability" on staff_availability for update using (is_admin());
create policy "admin delete availability" on staff_availability for delete using (is_admin());

-- ---- customers: NOT publicly readable. Public can only insert (to book),
-- admins can read/update everything. This lets the booking flow create a
-- customer row without exposing anyone else's contact details.
create policy "public can create customer" on customers for insert with check (true);
create policy "admin read customers" on customers for select using (is_admin());
create policy "admin update customers" on customers for update using (is_admin());
create policy "admin delete customers" on customers for delete using (is_admin());

-- ---- appointments: public can create (booking); cannot read/list anyone's
-- appointments (that would leak other customers' data). Admins have full access.
create policy "public can create appointment" on appointments for insert with check (
  status = 'pending'
  and appointment_date >= current_date
);
create policy "admin read appointments" on appointments for select using (is_admin());
create policy "admin update appointments" on appointments for update using (is_admin());
create policy "admin delete appointments" on appointments for delete using (is_admin());

-- ---- gallery: public read, admin write ----
create policy "public read gallery" on gallery for select using (true);
create policy "admin write gallery" on gallery for insert with check (is_admin());
create policy "admin update gallery" on gallery for update using (is_admin());
create policy "admin delete gallery" on gallery for delete using (is_admin());

-- ---- testimonials: public read published only, admin full access ----
create policy "public read published testimonials" on testimonials for select using (is_published or is_admin());
create policy "admin insert testimonials" on testimonials for insert with check (is_admin());
create policy "admin update testimonials" on testimonials for update using (is_admin());
create policy "admin delete testimonials" on testimonials for delete using (is_admin());

-- ---- contact_messages: public can insert only; admin can read/manage ----
create policy "public can send message" on contact_messages for insert with check (true);
create policy "admin read messages" on contact_messages for select using (is_admin());
create policy "admin update messages" on contact_messages for update using (is_admin());
create policy "admin delete messages" on contact_messages for delete using (is_admin());

-- ---- salon_settings: public read, admin write ----
create policy "public read settings" on salon_settings for select using (true);
create policy "admin update settings" on salon_settings for update using (is_admin());

-- =========================================================
-- STORAGE BUCKETS (run after enabling Storage in your project)
-- =========================================================
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('staff-photos', 'staff-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('service-images', 'service-images', true)
  on conflict (id) do nothing;

create policy "public read gallery bucket" on storage.objects for select
  using (bucket_id in ('gallery','staff-photos','service-images'));
create policy "admin write gallery bucket" on storage.objects for insert
  with check (bucket_id in ('gallery','staff-photos','service-images') and is_admin());
create policy "admin update gallery bucket" on storage.objects for update
  using (bucket_id in ('gallery','staff-photos','service-images') and is_admin());
create policy "admin delete gallery bucket" on storage.objects for delete
  using (bucket_id in ('gallery','staff-photos','service-images') and is_admin());
