import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { LoadingSpinner, ErrorState } from '@/components/StateViews';
import type { Appointment } from '@/types';

interface Stats {
  todayCount: number;
  upcomingCount: number;
  totalCount: number;
  completedCount: number;
  cancelledCount: number;
  totalServices: number;
  totalCustomers: number;
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5">
      <p className="text-sm text-stone">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          todayRes, upcomingRes, totalRes, completedRes, cancelledRes,
          servicesRes, customersRes, recentRes,
        ] = await Promise.all([
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).gt('appointment_date', today).in('status', ['pending', 'confirmed']),
          supabase.from('appointments').select('id', { count: 'exact', head: true }),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
          supabase.from('services').select('id', { count: 'exact', head: true }),
          supabase.from('customers').select('id', { count: 'exact', head: true }),
          supabase.from('appointments')
            .select('*, customer:customers(*), service:services(*), staff:staff(*)')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        const firstError = [todayRes, upcomingRes, totalRes, completedRes, cancelledRes, servicesRes, customersRes, recentRes]
          .find((r) => r.error)?.error;
        if (firstError) throw firstError;

        setStats({
          todayCount: todayRes.count ?? 0,
          upcomingCount: upcomingRes.count ?? 0,
          totalCount: totalRes.count ?? 0,
          completedCount: completedRes.count ?? 0,
          cancelledCount: cancelledRes.count ?? 0,
          totalServices: servicesRes.count ?? 0,
          totalCustomers: customersRes.count ?? 0,
        });
        setRecent((recentRes.data as Appointment[]) ?? []);
      } catch (err) {
        setError(friendlyError(err, 'Could not load dashboard data.'));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error || !stats) return <ErrorState message={error ?? 'No data available.'} />;

  return (
    <div>
      <h1 className="text-2xl">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today's appointments" value={stats.todayCount} />
        <StatCard label="Upcoming appointments" value={stats.upcomingCount} />
        <StatCard label="Total appointments" value={stats.totalCount} />
        <StatCard label="Completed" value={stats.completedCount} />
        <StatCard label="Cancelled" value={stats.cancelledCount} />
        <StatCard label="Total services" value={stats.totalServices} />
        <StatCard label="Total customers" value={stats.totalCustomers} />
      </div>

      <h2 className="mt-10 font-display text-lg">Recent bookings</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-stone">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((a) => (
              <tr key={a.id} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3">{a.customer?.full_name}</td>
                <td className="px-4 py-3">{a.service?.name}</td>
                <td className="px-4 py-3">{a.appointment_date} {a.start_time.slice(0, 5)}</td>
                <td className="px-4 py-3 capitalize">{a.status}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-stone">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
