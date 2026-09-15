import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { supabase, friendlyError } from '@/lib/supabase';
import { Modal } from '@/admin/components/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { Testimonial } from '@/types';

interface FormState {
  id: string | null;
  customer_name: string;
  rating: number;
  review: string;
  review_date: string;
  is_published: boolean;
}

const emptyForm: FormState = {
  id: null, customer_name: '', rating: 5, review: '', review_date: new Date().toISOString().slice(0, 10), is_published: false,
};

export function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('testimonials').select('*').order('review_date', { ascending: false });
    if (error) setError(friendlyError(error, 'Could not load testimonials.'));
    else setItems((data as Testimonial[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(t: Testimonial) {
    setForm({
      id: t.id, customer_name: t.customer_name, rating: t.rating, review: t.review,
      review_date: t.review_date, is_published: t.is_published,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const payload = {
      customer_name: form.customer_name, rating: form.rating, review: form.review,
      review_date: form.review_date, is_published: form.is_published,
    };
    const { error } = form.id
      ? await supabase.from('testimonials').update(payload).eq('id', form.id)
      : await supabase.from('testimonials').insert(payload);
    setSaving(false);
    if (error) { setFormError(friendlyError(error, 'Could not save this testimonial.')); return; }
    setModalOpen(false);
    load();
  }

  async function handleDelete(t: Testimonial) {
    if (!confirm(`Delete the review from "${t.customer_name}"?`)) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', t.id);
    if (!error) load();
  }

  async function togglePublished(t: Testimonial) {
    const { error } = await supabase.from('testimonials').update({ is_published: !t.is_published }).eq('id', t.id);
    if (!error) load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Testimonials</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm text-parchment">
          <Plus className="h-4 w-4" /> Add testimonial
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState title="No testimonials yet" />
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <div key={t.id} className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex gap-0.5 text-champagne">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" fill={i < t.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="mt-1 font-medium">{t.customer_name}</p>
                    <p className="mt-1 text-sm text-stone">{t.review}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${t.is_published ? 'bg-oak/20 text-oak' : 'bg-stone/20 text-stone'}`}>
                    {t.is_published ? 'Published' : 'Unpublished'}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(t)} className="flex items-center gap-1 rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => togglePublished(t)} className="rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    {t.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleDelete(t)} className="flex items-center gap-1 rounded-sm border border-rosewood/30 px-3 py-1.5 text-xs text-rosewood">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={form.id ? 'Edit testimonial' : 'Add testimonial'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Customer name" value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
            </select>
            <textarea required rows={3} placeholder="Review text" value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input type="date" value={form.review_date} onChange={(e) => setForm({ ...form, review_date: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
              Published (visible on the public site)
            </label>
            {formError && <p className="text-sm text-rosewood">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-sm bg-ink py-2.5 text-sm text-parchment disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
