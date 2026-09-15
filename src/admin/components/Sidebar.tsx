import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Scissors, Users, UserCircle,
  Image, MessageSquareQuote, Mail, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/admin/services', label: 'Services', icon: Scissors },
  { to: '/admin/staff', label: 'Staff', icon: UserCircle },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/gallery', label: 'Gallery', icon: Image },
  { to: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const content = (
    <nav className="flex h-full flex-col justify-between">
      <div>
        <p className="px-4 py-5 font-display text-lg text-parchment">Velvet & Oak</p>
        <ul className="space-y-1 px-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors duration-250 ${
                    isActive ? 'bg-champagne text-ink' : 'text-parchment/80 hover:bg-parchment/10'
                  }`
                }
              >
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-parchment/10 px-4 py-4">
        <p className="truncate text-xs text-parchment/60">{user?.email}</p>
        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-2 text-sm text-parchment/80 hover:text-champagne"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 bg-ink md:block">{content}</aside>

      <div className="flex items-center justify-between bg-ink px-4 py-3 md:hidden">
        <p className="font-display text-parchment">Velvet & Oak</p>
        <button onClick={() => setOpen((v) => !v)} className="text-parchment" aria-label="Toggle menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && <div className="w-full bg-ink md:hidden">{content}</div>}
    </>
  );
}
