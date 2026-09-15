import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/admin/components/Sidebar';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden bg-parchment p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
