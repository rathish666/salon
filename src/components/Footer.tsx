import { Link } from 'react-router-dom';
import { Instagram, Facebook, MapPin, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-parchment">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div>
          <p className="font-display text-lg">Velvet & Oak</p>
          <p className="mt-3 max-w-xs text-sm text-parchment/70">
            A quiet, considered space for haircuts, color, and styling — built around
            craft, not trends.
          </p>
          <div className="mt-4 flex gap-4">
            <a href="#" aria-label="Instagram" className="text-parchment/70 hover:text-champagne">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-parchment/70 hover:text-champagne">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Explore</p>
          <ul className="space-y-2 text-sm text-parchment/70">
            <li><Link to="/services" className="hover:text-champagne">Services</Link></li>
            <li><Link to="/staff" className="hover:text-champagne">Our Stylists</Link></li>
            <li><Link to="/gallery" className="hover:text-champagne">Gallery</Link></li>
            <li><Link to="/booking" className="hover:text-champagne">Book Appointment</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Hours</p>
          <ul className="space-y-1 text-sm text-parchment/70">
            <li>Mon – Sat: 9:00 AM – 8:00 PM</li>
            <li>Sunday: Closed</li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Visit</p>
          <ul className="space-y-2 text-sm text-parchment/70">
            <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 12 Linden Road, Bandra West, Mumbai</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> hello@velvetoak.in</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-parchment/10 px-6 py-5 text-center text-xs text-parchment/50">
        © {new Date().getFullYear()} Velvet & Oak Salon. All rights reserved.
      </div>
    </footer>
  );
}
