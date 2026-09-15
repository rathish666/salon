import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { Modal } from '@/admin/components/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { Customer, Appointment } from '@/types';

interface CustomerRow extends Customer {
  total_appointments: number;
  last_appointment: string | null;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    setError(null);

    let query = supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(200);
    if (debouncedSearch) query = query.or(`full_name.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
    const { data: customerData, error: customerError } = await query;
    if (customerError) { setError(friendlyError(customerError, 'Could not load customers.')); setLoading(false); return; }

    const list = (customerData as Customer[]) ?? [];
    if (list.length === 0) { setCustomers([]); setLoading(false); return; }

    const { data: apptData } = await supabase
      .from('appointments')
      .select('customer_id, appointment_date')
      .in('customer_id', list.map((c) => c.id));

    const stats = new Map<string, { count: number; last: string | null }>();
    for (const a of apptData ?? []) {
      const s = stats.get(a.customer_id) ?? { count: 0, last: null };
      s.count += 1;
      if (!s.last || a.appointment_date > s.last) s.last = a.appointment_date;
      stats.set(a.customer_id, s);
    }

    setCustomers(list.map((c) => ({
      ...c,
      total_appointments: stats.get(c.id)?.count ?? 0,
      last_appointment: stats.get(c.id)?.last ?? null,
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, [debouncedSearch]);

  async function openHistory(customer: CustomerRow) {
    setSelected(customer);
    setHistoryLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, service:services(*), staff:staff(*)')
      .eq('customer_id', customer.id)
      .order('appointment_date', { ascending: false });
    setHistory((data as Appointment[]) ?? []);
    setHistoryLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl">Customers</h1>
      <input
        placeholder="Search by name or phone" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full max-w-sm rounded-sm border border-ink/20 px-3 py-2 text-sm"
      />

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" message="Customers are created automatically when they book." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-stone">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Appointments</th>
                  <th className="px-4 py-3">Last visit</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-4 py-3">{c.full_name}</td>
                    <td className="px-4 py-3">{c.phone}</td>
                    <td className="px-4 py-3">{c.email ?? '—'}</td>
                    <td className="px-4 py-3">{c.total_appointments}</td>
                    <td className="px-4 py-3">{c.last_appointment ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openHistory(c)} className="text-xs underline underline-offset-2">
                        View history
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <Modal title={`${selected.full_name}'s appointments`} onClose={() => setSelected(null)}>
          {historyLoading ? (
            <LoadingSpinner />
          ) : history.length === 0 ? (
            <p className="text-sm text-stone">No appointments on record.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((a) => (
                <li key={a.id} className="rounded-sm border border-ink/10 p-3 text-sm">
                  <p className="font-medium">{a.service?.name}</p>
                  <p className="text-stone">{a.appointment_date} · {a.start_time.slice(0, 5)} {a.staff ? `· ${a.staff.full_name}` : ''}</p>
                  <p className="mt-1 text-xs capitalize text-stone">{a.status.replace('_', ' ')}</p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
