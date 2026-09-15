import { Link, useNavigate } from 'react-router-dom';
import { Scissors, Heart, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/Button';
import { ServiceCard } from '@/components/ServiceCard';
import { TestimonialCard } from '@/components/StaffCard';
import { LoadingSpinner, EmptyState } from '@/components/StateViews';
import { useServices, useTestimonials, useGallery } from '@/hooks/usePublicData';

export function Home() {
  const navigate = useNavigate();
  const { data: services, loading: servicesLoading } = useServices();
  const { data: testimonials, loading: testimonialsLoading } = useTestimonials();
  const { data: galleryImages } = useGallery();

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="fade-in-up">
          <h1 className="text-4xl leading-tight md:text-5xl">
            Considered hair, cut and colored with care.
          </h1>
          <p className="mt-5 max-w-md text-stone">
            Velvet & Oak is a quiet studio in Bandra where every appointment starts
            with a real conversation about your hair — not a trend chart.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button onClick={() => navigate('/booking')}>Book Appointment</Button>
            <Link
              to="/services"
              className="inline-flex items-center rounded-sm border border-ink px-6 py-3 text-sm font-medium transition-colors duration-250 hover:bg-ink hover:text-parchment"
            >
              View Services
            </Link>
          </div>
        </div>
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-stone/20">
          <img
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80"
            alt="Stylist finishing a client's haircut in a warm, minimal studio"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* Why choose us */}
      <section className="border-y border-ink/10 bg-cream/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
          {[
            { icon: Scissors, title: 'Trained stylists', copy: 'Every stylist trains continuously in cutting and color technique.' },
            { icon: Heart, title: 'Unhurried appointments', copy: 'We schedule with real buffer time, so your visit never feels rushed.' },
            { icon: ShieldCheck, title: 'Products we trust', copy: 'We use ammonia-free color and treat every scalp with care.' },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-champagne" />
              <h3 className="mt-3 font-display text-lg">{title}</h3>
              <p className="mt-1 text-sm text-stone">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl md:text-3xl">Featured services</h2>
          <Link to="/services" className="text-sm underline underline-offset-4">
            See all services
          </Link>
        </div>
        <div className="mt-8">
          {servicesLoading ? (
            <LoadingSpinner label="Loading services…" />
          ) : services.length === 0 ? (
            <EmptyState title="Services coming soon" message="Check back shortly, or contact us directly to book." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery preview */}
      {galleryImages.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="text-2xl md:text-3xl">From the studio</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryImages.slice(0, 8).map((img) => (
              <div key={img.id} className="aspect-square overflow-hidden rounded-lg bg-stone/20">
                <img src={img.image_url} alt={img.caption ?? ''} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/gallery" className="text-sm underline underline-offset-4">View full gallery</Link>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="border-t border-ink/10 bg-ink py-16 text-parchment">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl md:text-3xl">What clients say</h2>
          <div className="mt-8">
            {testimonialsLoading ? (
              <LoadingSpinner label="Loading reviews…" />
            ) : testimonials.length === 0 ? (
              <p className="text-parchment/70">No reviews published yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {testimonials.slice(0, 3).map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hours + location CTA */}
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl"><Clock className="h-5 w-5" /> Opening hours</h3>
          <p className="mt-2 text-sm text-stone">Monday – Saturday: 9:00 AM – 8:00 PM</p>
          <p className="text-sm text-stone">Sunday: Closed</p>
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-display text-xl"><MapPin className="h-5 w-5" /> Find us</h3>
          <p className="mt-2 text-sm text-stone">12 Linden Road, Bandra West, Mumbai</p>
          <Link to="/contact" className="mt-3 inline-block text-sm underline underline-offset-4">Get directions</Link>
        </div>
      </section>
    </div>
  );
}
