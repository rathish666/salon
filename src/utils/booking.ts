import { supabase } from '@/lib/supabase';

export interface TimeSlot {
  start: string; // "HH:MM"
  end: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Fetches the working window for a given staff member and day of week,
 * then subtracts any existing (non-cancelled) appointments for that
 * staff/date, returning bookable slots of `durationMinutes`.
 *
 * This is a best-effort client-side computation to drive the UI — the
 * actual guarantee against double-booking is the database exclusion
 * constraint (`no_overlapping_staff_appointments`), which will reject
 * a conflicting insert even if the client's view of availability is stale.
 */
export async function getAvailableSlots(
  staffId: string,
  dateISO: string,
  durationMinutes: number,
  slotIntervalMinutes = 15
): Promise<TimeSlot[]> {
  const dayOfWeek = new Date(`${dateISO}T00:00:00`).getDay();

  const { data: availability, error: availError } = await supabase
    .from('staff_availability')
    .select('start_time, end_time, is_closed')
    .eq('staff_id', staffId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (availError || !availability || availability.is_closed) return [];

  const dayStart = toMinutes(availability.start_time.slice(0, 5));
  const dayEnd = toMinutes(availability.end_time.slice(0, 5));

  const { data: existing, error: apptError } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('staff_id', staffId)
    .eq('appointment_date', dateISO)
    .neq('status', 'cancelled');

  if (apptError) return [];

  const busyRanges = (existing ?? []).map((a) => ({
    start: toMinutes(a.start_time.slice(0, 5)),
    end: toMinutes(a.end_time.slice(0, 5)),
  }));

  const now = new Date();
  const isToday = dateISO === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];
  for (let start = dayStart; start + durationMinutes <= dayEnd; start += slotIntervalMinutes) {
    const end = start + durationMinutes;
    if (isToday && start <= nowMinutes) continue;
    const overlaps = busyRanges.some((b) => start < b.end && end > b.start);
    if (!overlaps) slots.push({ start: toHHMM(start), end: toHHMM(end) });
  }
  return slots;
}

export interface BookingPayload {
  serviceId: string;
  staffId: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  customer: { fullName: string; phone: string; email: string };
  notes?: string;
}

export async function submitBooking(payload: BookingPayload): Promise<{ error: string | null }> {
  // Customer rows are private under RLS, so this runs the lookup/create and
  // appointment insert together in a database function instead of requesting
  // the new customer's id from the browser.
  const { error: bookingError } = await supabase.rpc('create_public_booking', {
    p_service_id: payload.serviceId,
    p_staff_id: payload.staffId,
    p_appointment_date: payload.date,
    p_start_time: payload.startTime,
    p_end_time: payload.endTime,
    p_full_name: payload.customer.fullName,
    p_phone: payload.customer.phone,
    p_email: payload.customer.email || null,
    p_notes: payload.notes || null,
  });

  if (bookingError) {
    // Postgres exclusion-constraint violations surface as code 23P01.
    if ((bookingError as { code?: string }).code === '23P01') {
      return { error: 'That time was just booked by someone else. Please pick another slot.' };
    }
    return { error: 'Could not save your details. Please check them and try again.' };
  }

  return { error: null };
}
