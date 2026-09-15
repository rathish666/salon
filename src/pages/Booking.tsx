import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useServices, useStaff } from '@/hooks/usePublicData';
import { getAvailableSlots, submitBooking, type TimeSlot } from '@/utils/booking';
import { LoadingSpinner } from '@/components/StateViews';
import type { Service, Staff } from '@/types';

type Step = 'service' | 'stylist' | 'datetime' | 'details' | 'confirmation';

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function Booking() {
  const [params] = useSearchParams();
  const { data: services, loading: servicesLoading } = useServices();
  const { data: staff, loading: staffLoading } = useStaff();

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(addDaysISO(0));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customer, setCustomer] = useState({ fullName: '', phone: '', email: '' });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Preselect service from ?service=<id> (e.g. linked from the Services page).
  useEffect(() => {
    const preselectId = params.get('service');
    if (preselectId && services.length > 0) {
      const match = services.find((s) => s.id === preselectId);
      if (match) setSelectedService(match);
    }
  }, [params, services]);

  useEffect(() => {
    if (step !== 'datetime' || !selectedStaff || !selectedService) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getAvailableSlots(selectedStaff.id, selectedDate, selectedService.duration_minutes)
      .then(setSlots)
      .finally(() => setSlotsLoading(false));
  }, [step, selectedStaff, selectedDate, selectedService]);

  const summary = useMemo(() => {
    const parts = [selectedService?.name, selectedStaff?.full_name, selectedDate, selectedSlot?.start];
    return parts.filter(Boolean).join(' • ');
  }, [selectedService, selectedStaff, selectedDate, selectedSlot]);

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await submitBooking({
      serviceId: selectedService.id,
      staffId: selectedStaff?.id ?? null,
      date: selectedDate,
      startTime: selectedSlot.start,
      endTime: selectedSlot.end,
      customer,
      notes,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    setStep('confirmation');
  }

  if (step === 'confirmation') {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-oak" />
        <h1 className="mt-4 text-2xl">Appointment requested</h1>
        <p className="mt-2 text-stone">
          {summary}. We'll confirm by phone or SMS shortly — your booking currently
          shows as <strong>pending</strong> until then.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl">Book an appointment</h1>
      {summary && <p className="mt-2 text-sm text-stone">{summary}</p>}

      {/* Step: service */}
      {step === 'service' && (
        <div className="mt-8">
          <h2 className="font-display text-lg">Choose a service</h2>
          {servicesLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedService(s); setStep('stylist'); }}
                  className={`rounded-lg border p-4 text-left transition-colors duration-250 ${
                    selectedService?.id === s.id ? 'border-ink bg-cream' : 'border-ink/15 hover:border-ink'
                  }`}
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-stone">{s.duration_minutes} min • ₹{s.price.toLocaleString('en-IN')}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: stylist */}
      {step === 'stylist' && (
        <div className="mt-8">
          <h2 className="font-display text-lg">Choose a stylist</h2>
          {staffLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); setStep('datetime'); }}
                  className={`rounded-lg border p-4 text-center transition-colors duration-250 ${
                    selectedStaff?.id === s.id ? 'border-ink bg-cream' : 'border-ink/15 hover:border-ink'
                  }`}
                >
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-sm text-stone">{s.specialization}</p>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setStep('service')} className="mt-6 text-sm underline underline-offset-4">
            Back
          </button>
        </div>
      )}

      {/* Step: date & time */}
      {step === 'datetime' && (
        <div className="mt-8">
          <h2 className="font-display text-lg">Choose a date and time</h2>
          <input
            type="date"
            min={addDaysISO(0)}
            max={addDaysISO(60)}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-4 rounded-sm border border-ink/20 px-3 py-2 text-sm"
          />
          <div className="mt-4">
            {slotsLoading ? (
              <LoadingSpinner label="Checking availability…" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-stone">No slots available this day — try another date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className={`rounded-sm border px-3 py-2 text-sm transition-colors duration-250 ${
                      selectedSlot?.start === slot.start ? 'border-ink bg-ink text-parchment' : 'border-ink/20 hover:border-ink'
                    }`}
                  >
                    {slot.start}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-4">
            <button onClick={() => setStep('stylist')} className="text-sm underline underline-offset-4">Back</button>
            <button
              disabled={!selectedSlot}
              onClick={() => setStep('details')}
              className="rounded-sm bg-ink px-5 py-2 text-sm text-parchment disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: details */}
      {step === 'details' && (
        <div className="mt-8">
          <h2 className="font-display text-lg">Your details</h2>
          <div className="mt-4 space-y-4">
            <input
              placeholder="Full name" value={customer.fullName}
              onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone number" value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
            <input
              placeholder="Email (optional)" value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Notes for your stylist (optional)" rows={3} value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-6 rounded-lg border border-ink/10 bg-cream p-4 text-sm">
            <p className="font-medium">Booking summary</p>
            <p className="mt-1 text-stone">{summary}</p>
          </div>

          {submitError && <p className="mt-4 text-sm text-rosewood">{submitError}</p>}

          <div className="mt-6 flex gap-4">
            <button onClick={() => setStep('datetime')} className="text-sm underline underline-offset-4">Back</button>
            <button
              disabled={!customer.fullName || !customer.phone || submitting}
              onClick={handleConfirm}
              className="rounded-sm bg-ink px-5 py-2 text-sm text-parchment disabled:opacity-40"
            >
              {submitting ? 'Booking…' : 'Confirm appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
