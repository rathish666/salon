import { useEffect, useState, FormEvent } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { supabase, friendlyError } from '@/lib/supabase';
import { uploadImage, deleteImageByUrl } from '@/admin/utils/storage';
import { Modal } from '@/admin/components/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { GalleryImage } from '@/types';

const BUCKET = 'gallery';
const CATEGORIES = ['Haircuts', 'Hair Color', 'Styling', 'Bridal', 'Salon Interior', 'Other'];

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [caption, setCaption] = useState('');
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (error) setError(friendlyError(error, 'Could not load the gallery.'));
    else setImages((data as GalleryImage[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openUpload() {
    setFile(null);
    setCategory(CATEGORIES[0]);
    setCaption('');
    setFeatured(false);
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) { setFormError('Please choose an image.'); return; }
    setSaving(true);
    setFormError(null);

    const { url, error: uploadError } = await uploadImage(BUCKET, file);
    if (uploadError || !url) { setFormError(uploadError ?? 'Upload failed.'); setSaving(false); return; }

    const { error } = await supabase.from('gallery').insert({
      image_url: url, category, caption: caption || null, is_featured: featured,
    });
    setSaving(false);
    if (error) { setFormError(friendlyError(error, 'Could not save this image.')); return; }
    setModalOpen(false);
    load();
  }

  async function handleDelete(image: GalleryImage) {
    if (!confirm('Delete this image?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', image.id);
    if (error) { alert('Could not delete this image.'); return; }
    await deleteImageByUrl(BUCKET, image.image_url);
    load();
  }

  async function toggleFeatured(image: GalleryImage) {
    const { error } = await supabase.from('gallery').update({ is_featured: !image.is_featured }).eq('id', image.id);
    if (!error) load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Gallery</h1>
        <button onClick={openUpload} className="flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm text-parchment">
          <Plus className="h-4 w-4" /> Upload image
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : images.length === 0 ? (
          <EmptyState title="No images yet" message="Upload your first photo to populate the gallery." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-stone/20">
                <img src={img.image_url} alt={img.caption ?? img.category} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-ink/0 p-2 opacity-0 transition-opacity duration-250 group-hover:bg-ink/50 group-hover:opacity-100">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => toggleFeatured(img)} className="rounded-full bg-white/90 p-1.5" aria-label="Toggle featured">
                      <Star className="h-3.5 w-3.5" fill={img.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleDelete(img)} className="rounded-full bg-white/90 p-1.5 text-rosewood" aria-label="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-white">{img.category}</p>
                </div>
                {img.is_featured && (
                  <span className="absolute left-2 top-2 rounded-full bg-champagne px-2 py-0.5 text-[10px] font-medium text-ink">Featured</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title="Upload image" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm" />
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              Mark as featured
            </label>
            {formError && <p className="text-sm text-rosewood">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-sm bg-ink py-2.5 text-sm text-parchment disabled:opacity-50">
              {saving ? 'Uploading…' : 'Upload'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
