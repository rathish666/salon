import { Star } from 'lucide-react';
import type { Staff, Testimonial } from '@/types';

export function StaffCard({ staff }: { staff: Staff }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-cream p-5 text-center">
      <div className="mx-auto h-28 w-28 overflow-hidden rounded-full bg-stone/20">
        {staff.photo_url ? (
          <img src={staff.photo_url} alt={staff.full_name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <h3 className="mt-4 font-display text-lg">{staff.full_name}</h3>
      <p className="text-sm text-champagne">{staff.specialization}</p>
      <p className="mt-2 text-sm text-stone">{staff.bio}</p>
      <p className="mt-2 text-xs text-stone">{staff.experience_years}+ years experience</p>
    </div>
  );
}

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-cream p-6">
      <div className="flex gap-0.5 text-champagne">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4" fill={i < testimonial.rating ? 'currentColor' : 'none'} />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink/80">{testimonial.review}</p>
      <div className="mt-4 flex items-center gap-3">
        {testimonial.photo_url && (
          <img src={testimonial.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        )}
        <span className="text-sm font-medium">{testimonial.customer_name}</span>
      </div>
    </div>
  );
}
