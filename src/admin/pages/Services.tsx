import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { supabase, friendlyError } from '@/lib/supabase';
import { uploadImage, deleteImageByUrl } from '@/admin/utils/storage';
import { Modal } from '@/admin/components/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { Service, ServiceCategory } from '@/types';

const BUCKET = 'service-images';

interface FormState {
  id: string | null;
  name: string;
  description: string;
  category_id: string;
  duration_minutes: string;
  price: string;
  is_active: boolean;
  image_url: string | null;
}

interface CategoryFormState {
  id: string | null;
  name: string;
  sort_order: string;
}

const emptyForm: FormState = {
  id: null, name: '', description: '', category_id: '',
  duration_minutes: '30', price: '0', is_active: true, image_url: null,
};

const emptyCategoryForm: CategoryFormState = { id: null, name: '', sort_order: '0' };

export function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const [servicesRes, categoriesRes] = await Promise.all([
      supabase.from('services').select('*, category:service_categories(*)').order('name'),
      supabase.from('service_categories').select('*').order('sort_order'),
    ]);
    if (servicesRes.error) setError(friendlyError(servicesRes.error, 'Could not load services.'));
    else setServices((servicesRes.data as Service[]) ?? []);
    setCategories((categoriesRes.data as ServiceCategory[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ ...emptyForm, category_id: categories[0]?.id ?? '' });
    setFile(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(service: Service) {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description,
      category_id: service.category_id,
      duration_minutes: String(service.duration_minutes),
      price: String(service.price),
      is_active: service.is_active,
      image_url: service.image_url,
    });
    setFile(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openCreateCategory() {
    setCategoryForm({
      ...emptyCategoryForm,
      sort_order: String(categories.length ? Math.max(...categories.map((category) => category.sort_order)) + 1 : 1),
    });
    setCategoryError(null);
    setCategoryModalOpen(true);
  }

  function openEditCategory(category: ServiceCategory) {
    setCategoryForm({ id: category.id, name: category.name, sort_order: String(category.sort_order) });
    setCategoryError(null);
    setCategoryModalOpen(true);
  }

  async function handleCategorySubmit(e: FormEvent) {
    e.preventDefault();
    setCategorySaving(true);
    setCategoryError(null);
    const payload = { name: categoryForm.name.trim(), sort_order: Number(categoryForm.sort_order) };
    const { error } = categoryForm.id
      ? await supabase.from('service_categories').update(payload).eq('id', categoryForm.id)
      : await supabase.from('service_categories').insert(payload);
    setCategorySaving(false);
    if (error) {
      setCategoryError(error.code === '23505' ? 'A category with this name already exists.' : friendlyError(error, 'Could not save this category.'));
      return;
    }
    setCategoryModalOpen(false);
    load();
  }

  async function handleCategoryDelete(category: ServiceCategory) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    const { error } = await supabase.from('service_categories').delete().eq('id', category.id);
    if (error) {
      alert('This category has services assigned to it. Move or delete those services before deleting the category.');
      return;
    }
    load();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    let imageUrl = form.image_url;
    if (file) {
      const { url, error } = await uploadImage(BUCKET, file);
      if (error) { setFormError(error); setSaving(false); return; }
      imageUrl = url;
    }

    const payload = {
      name: form.name,
      description: form.description,
      category_id: form.category_id,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      is_active: form.is_active,
      image_url: imageUrl,
    };

    const { error } = form.id
      ? await supabase.from('services').update(payload).eq('id', form.id)
      : await supabase.from('services').insert(payload);

    setSaving(false);
    if (error) { setFormError(friendlyError(error, 'Could not save this service.')); return; }
    setModalOpen(false);
    load();
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('services').delete().eq('id', service.id);
    if (error) {
      // Services referenced by existing appointments can't be deleted (FK restrict).
      alert('This service has existing appointments and cannot be deleted. Disable it instead.');
      return;
    }
    if (service.image_url) await deleteImageByUrl(BUCKET, service.image_url);
    load();
  }

  async function toggleActive(service: Service) {
    const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
    if (!error) load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Services</h1>
        <div className="flex gap-2">
          <button onClick={openCreateCategory} className="flex items-center gap-2 rounded-sm border border-ink/20 px-4 py-2 text-sm">
            <Plus className="h-4 w-4" /> Add category
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm text-parchment">
            <Plus className="h-4 w-4" /> Add service
          </button>
        </div>
      </div>

      {!loading && !error && (
        <section className="mt-6 rounded-lg border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Service categories</h2>
              <p className="mt-1 text-sm text-stone">Organize services into categories shown on the public site.</p>
            </div>
            <span className="text-sm text-stone">{categories.length} categories</span>
          </div>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-stone">No categories yet. Add one before creating a service.</p>
          ) : (
            <div className="mt-4 divide-y divide-ink/10">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span>{category.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEditCategory(category)} className="flex items-center gap-1 rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button onClick={() => handleCategoryDelete(category)} className="flex items-center gap-1 rounded-sm border border-rosewood/30 px-3 py-1.5 text-xs text-rosewood">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : services.length === 0 ? (
          <EmptyState title="No services yet" message="Add your first service to get started." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div key={s.id} className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="aspect-[4/3] overflow-hidden rounded bg-stone/20">
                  {s.image_url && <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />}
                </div>
                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-stone">{s.category?.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${s.is_active ? 'bg-oak/20 text-oak' : 'bg-stone/20 text-stone'}`}>
                    {s.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone">{s.duration_minutes} min · ₹{s.price.toLocaleString('en-IN')}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => openEdit(s)} className="flex items-center gap-1 rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleActive(s)} className="rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    {s.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(s)} className="flex items-center gap-1 rounded-sm border border-rosewood/30 px-3 py-1.5 text-xs text-rosewood">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={form.id ? 'Edit service' : 'Add service'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Service name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <textarea required placeholder="Description" rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <select required value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm">
              <option value="" disabled>Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-3">
              <input required type="number" min={5} placeholder="Duration (min)" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-1/2 rounded-sm border border-ink/20 px-3 py-2 text-sm" />
              <input required type="number" min={0} placeholder="Price (₹)" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-1/2 rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone">
              <ImagePlus className="h-4 w-4" />
              {file ? file.name : 'Upload image (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (visible on the public site)
            </label>
            {formError && <p className="text-sm text-rosewood">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-sm bg-ink py-2.5 text-sm text-parchment disabled:opacity-50">
              {saving ? 'Saving…' : 'Save service'}
            </button>
          </form>
        </Modal>
      )}

      {categoryModalOpen && (
        <Modal title={categoryForm.id ? 'Edit category' : 'Add category'} onClose={() => setCategoryModalOpen(false)}>
          <form onSubmit={handleCategorySubmit} className="space-y-3">
            <input required placeholder="Category name" value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input required type="number" min={0} placeholder="Display order" value={categoryForm.sort_order}
              onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            {categoryError && <p className="text-sm text-rosewood">{categoryError}</p>}
            <button type="submit" disabled={categorySaving} className="w-full rounded-sm bg-ink py-2.5 text-sm text-parchment disabled:opacity-50">
              {categorySaving ? 'Saving…' : 'Save category'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
