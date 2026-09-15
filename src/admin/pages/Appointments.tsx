import { useCallback, useEffect, useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_OPTIONS: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-champagne/30 text-oak',
  confirmed: 'bg-oak/20 text-oak',
  completed: 'bg-stone/20 text-ink',
  cancelled: 'bg-rosewood/15 text-rosewood',
  no_show: 'bg-rosewood/25 text-rosewood',
};

export function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase
      .from('appointments')
      .select('*, customer:customers(*), service:services(*), staff:staff(*)')
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(100);

    if (dateFilter) query = query.eq('appointment_date', dateFilter);
    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) {
      setError(friendlyError(error, 'Could not load appointments.'));
      setLoading(false);
      return;
    }

    let results = (data as Appointment[]) ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      results = results.filter(
        (a) => a.customer?.full_name.toLowerCase().includes(q) || a.customer?.phone.includes(q)
      );
    }
    setAppointments(results);
    setLoading(false);
  }, [dateFilter, statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    const previous = appointments;
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      setAppointments(previous); // roll back optimistic update
      setError(friendlyError(error, 'Could not update that appointment.'));
    }
  }

  return (
    <div>
      <h1 className="text-2xl">Appointments</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="date" value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-sm border border-ink/20 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
          className="rounded-sm border border-ink/20 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <input
          placeholder="Search customer name or phone" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-sm border border-ink/20 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments match these filters" />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-lg border border-ink/10 bg-white md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-stone">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Stylist</th>
                    <th className="px-4 py-3">Date & time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3">
                        <p>{a.customer?.full_name}</p>
                        <p className="text-xs text-stone">{a.customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3">{a.service?.name}</td>
                      <td className="px-4 py-3">{a.staff?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">{a.appointment_date} · {a.start_time.slice(0, 5)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[a.status]}`}>
                          {a.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.status}
                          onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                          className="rounded-sm border border-ink/20 px-2 py-1 text-xs"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {appointments.map((a) => (
                <div key={a.id} className="rounded-lg border border-ink/10 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{a.customer?.full_name}</p>
                      <p className="text-xs text-stone">{a.customer?.phone}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[a.status]}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{a.service?.name} {a.staff ? `· ${a.staff.full_name}` : ''}</p>
                  <p className="text-sm text-stone">{a.appointment_date} · {a.start_time.slice(0, 5)}</p>
                  <select
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                    className="mt-3 w-full rounded-sm border border-ink/20 px-2 py-1.5 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
