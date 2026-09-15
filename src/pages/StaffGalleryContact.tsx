import { useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { StaffCard } from '@/components/StaffCard';
import { GalleryGrid } from '@/components/GalleryGrid';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import { useStaff, useGallery } from '@/hooks/usePublicData';

export function StaffPage() {
  const { data: staff, loading, error } = useStaff();
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl">Our stylists</h1>
      <p className="mt-2 max-w-xl text-stone">Meet the people behind the chair.</p>
      <div className="mt-10">
        {loading ? (
          <LoadingSpinner label="Loading our team…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : staff.length === 0 ? (
          <EmptyState title="Team profiles coming soon" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <StaffCard key={s.id} staff={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const GALLERY_CATEGORIES = ['Haircuts', 'Hair Color', 'Styling', 'Bridal', 'Salon Interior', 'Other'];

export function GalleryPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: images, loading, error } = useGallery(category);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl">Gallery</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={`rounded-full border px-4 py-1.5 text-sm ${!category ? 'border-ink bg-ink text-parchment' : 'border-ink/20'}`}
        >
          All
        </button>
        {GALLERY_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 text-sm ${category === c ? 'border-ink bg-ink text-parchment' : 'border-ink/20'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {loading ? (
          <LoadingSpinner label="Loading gallery…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : images.length === 0 ? (
          <EmptyState title="No images in this category yet" />
        ) : (
          <GalleryGrid images={images} />
        )}
      </div>
    </div>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      message: form.message,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(friendlyError(error, 'We could not send your message. Please try WhatsApp or call us directly.'));
      return;
    }
    setStatus('success');
    setForm({ name: '', email: '', phone: '', message: '' });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-3xl">Get in touch</h1>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm text-stone">12 Linden Road, Bandra West, Mumbai</p>
          <p className="mt-1 text-sm text-stone">+91 98765 43210</p>
          <p className="text-sm text-stone">hello@velvetoak.in</p>
          <p className="mt-1 text-sm text-stone">Mon – Sat, 9:00 AM – 8:00 PM</p>
          <div className="mt-4">
            <WhatsAppButton phoneNumber="919876543210" message="Hi! I'd like to ask about an appointment." />
          </div>
          <div className="mt-6 aspect-video overflow-hidden rounded-lg bg-stone/20">
            <iframe
              title="Salon location"
              className="h-full w-full border-0"
              loading="lazy"
              src="https://www.google.com/maps?q=Bandra+West,+Mumbai&output=embed"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm">Name</label>
            <input
              id="name" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm">Email</label>
            <input
              id="email" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm">Phone (optional)</label>
            <input
              id="phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm">Message</label>
            <textarea
              id="message" required rows={4} value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm focus:border-ink"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-sm bg-ink px-6 py-3 text-sm font-medium text-parchment disabled:opacity-50"
          >
            {status === 'submitting' ? 'Sending…' : 'Send message'}
          </button>
          {status === 'success' && <p className="text-sm text-oak">Thanks — we'll reply within one business day.</p>}
          {status === 'error' && <p className="text-sm text-rosewood">{errorMsg}</p>}
        </form>
      </div>
    </div>
  );
}
