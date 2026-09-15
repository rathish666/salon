import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/staff', label: 'Our Stylists' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-parchment/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-xl">
          Velvet & Oak
        </Link>

        <ul className="hidden gap-8 md:flex">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `text-sm transition-colors duration-250 hover:text-champagne ${isActive ? 'text-champagne' : 'text-ink'}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <Link
          to="/booking"
          className="hidden rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-parchment transition-colors duration-250 hover:bg-champagne hover:text-ink md:inline-flex"
        >
          Book Appointment
        </Link>

        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/10 px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} onClick={() => setOpen(false)} className="text-sm">
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link
                to="/booking"
                onClick={() => setOpen(false)}
                className="inline-block rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-parchment"
              >
                Book Appointment
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
