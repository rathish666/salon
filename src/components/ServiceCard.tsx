import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import type { Service } from '@/types';

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="group overflow-hidden rounded-lg border border-ink/10 bg-cream transition-shadow duration-250 hover:shadow-lg">
      <div className="aspect-[4/3] overflow-hidden bg-stone/20">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone">No image</div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg">{service.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone">{service.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-stone">
            <Clock className="h-3.5 w-3.5" /> {service.duration_minutes} min
          </span>
          <span className="font-display text-base">₹{service.price.toLocaleString('en-IN')}</span>
        </div>
        <Link
          to={`/booking?service=${service.id}`}
          className="mt-4 block rounded-sm border border-ink py-2 text-center text-sm font-medium transition-colors duration-250 hover:bg-ink hover:text-parchment"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
