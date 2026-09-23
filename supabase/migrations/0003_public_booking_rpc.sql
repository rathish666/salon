-- Keep customer records private while allowing the public booking flow to
-- create or reuse a customer and then create the appointment atomically.
create or replace function public.create_public_booking(
  p_service_id uuid,
  p_staff_id uuid,
  p_appointment_date date,
  p_start_time time,
  p_end_time time,
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_uuid uuid;
begin
  insert into public.customers (full_name, phone, email)
  values (p_full_name, p_phone, p_email)
  on conflict (phone) do update
    set full_name = excluded.full_name,
        email = coalesce(excluded.email, public.customers.email)
  returning id into customer_uuid;

  insert into public.appointments (
    customer_id,
    service_id,
    staff_id,
    appointment_date,
    start_time,
    end_time,
    status,
    notes
  ) values (
    customer_uuid,
    p_service_id,
    p_staff_id,
    p_appointment_date,
    p_start_time,
    p_end_time,
    'pending',
    p_notes
  );
end;
$$;

revoke all on function public.create_public_booking(uuid, uuid, date, time, time, text, text, text, text) from public;
grant execute on function public.create_public_booking(uuid, uuid, date, time, time, text, text, text, text) to anon, authenticated;