import { useEffect, useState, FormEvent } from 'react';
import { Plus, Pencil, Trash2, ImagePlus } from 'lucide-react';
import { supabase, friendlyError } from '@/lib/supabase';
import { uploadImage, deleteImageByUrl } from '@/admin/utils/storage';
import { Modal } from '@/admin/components/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { Staff, StaffAvailability } from '@/types';

const BUCKET = 'staff-photos';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

function defaultAvailability(): DayRow[] {
  return DAY_NAMES.map((_, day) => ({
    day_of_week: day,
    start_time: '09:00',
    end_time: '20:00',
    is_closed: day === 0,
  }));
}

interface FormState {
  id: string | null;
  full_name: string;
  bio: string;
  specialization: string;
  experience_years: string;
  is_active: boolean;
  photo_url: string | null;
}

const emptyForm: FormState = {
  id: null, full_name: '', bio: '', specialization: '', experience_years: '0', is_active: true, photo_url: null,
};

export function AdminStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [availability, setAvailability] = useState<DayRow[]>(defaultAvailability());
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('staff').select('*').order('full_name');
    if (error) setError(friendlyError(error, 'Could not load staff.'));
    else setStaff((data as Staff[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(emptyForm);
    setAvailability(defaultAvailability());
    setFile(null);
    setFormError(null);
    setModalOpen(true);
  }

  async function openEdit(member: Staff) {
    setForm({
      id: member.id,
      full_name: member.full_name,
      bio: member.bio,
      specialization: member.specialization,
      experience_years: String(member.experience_years),
      is_active: member.is_active,
      photo_url: member.photo_url,
    });
    setFile(null);
    setFormError(null);

    const { data } = await supabase
      .from('staff_availability')
      .select('*')
      .eq('staff_id', member.id)
      .order('day_of_week');
    const existing = (data as StaffAvailability[]) ?? [];
    const merged = defaultAvailability().map((d) => {
      const match = existing.find((e) => e.day_of_week === d.day_of_week);
      return match
        ? { day_of_week: d.day_of_week, start_time: match.start_time.slice(0, 5), end_time: match.end_time.slice(0, 5), is_closed: match.is_closed }
        : d;
    });
    setAvailability(merged);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    let photoUrl = form.photo_url;
    if (file) {
      const { url, error } = await uploadImage(BUCKET, file);
      if (error) { setFormError(error); setSaving(false); return; }
      photoUrl = url;
    }

    const payload = {
      full_name: form.full_name,
      bio: form.bio,
      specialization: form.specialization,
      experience_years: Number(form.experience_years),
      is_active: form.is_active,
      photo_url: photoUrl,
    };

    let staffId = form.id;
    if (staffId) {
      const { error } = await supabase.from('staff').update(payload).eq('id', staffId);
      if (error) { setFormError(friendlyError(error, 'Could not save this stylist.')); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('staff').insert(payload).select('id').single();
      if (error) { setFormError(friendlyError(error, 'Could not create this stylist.')); setSaving(false); return; }
      staffId = data.id;
    }

    // Upsert availability rows (unique on staff_id + day_of_week).
    const rows = availability.map((d) => ({
      staff_id: staffId,
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      is_closed: d.is_closed,
    }));
    const { error: availError } = await supabase
      .from('staff_availability')
      .upsert(rows, { onConflict: 'staff_id,day_of_week' });

    setSaving(false);
    if (availError) { setFormError(friendlyError(availError, 'Stylist saved, but availability could not be updated.')); return; }
    setModalOpen(false);
    load();
  }

  async function handleDelete(member: Staff) {
    if (!confirm(`Remove "${member.full_name}"? Existing appointments will keep this stylist on record but they'll no longer be bookable.`)) return;
    // Appointments reference staff with ON DELETE SET NULL, so this is always safe.
    const { error } = await supabase.from('staff').delete().eq('id', member.id);
    if (error) { alert('Could not remove this stylist.'); return; }
    if (member.photo_url) await deleteImageByUrl(BUCKET, member.photo_url);
    load();
  }

  async function toggleActive(member: Staff) {
    const { error } = await supabase.from('staff').update({ is_active: !member.is_active }).eq('id', member.id);
    if (!error) load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Staff</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm text-parchment">
          <Plus className="h-4 w-4" /> Add stylist
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : staff.length === 0 ? (
          <EmptyState title="No stylists yet" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {staff.map((s) => (
              <div key={s.id} className="rounded-lg border border-ink/10 bg-white p-4 text-center">
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-stone/20">
                  {s.photo_url && <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" />}
                </div>
                <p className="mt-3 font-medium">{s.full_name}</p>
                <p className="text-xs text-stone">{s.specialization}</p>
                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${s.is_active ? 'bg-oak/20 text-oak' : 'bg-stone/20 text-stone'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
                <div className="mt-3 flex justify-center gap-2">
                  <button onClick={() => openEdit(s)} className="flex items-center gap-1 rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleActive(s)} className="rounded-sm border border-ink/20 px-3 py-1.5 text-xs">
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(s)} className="flex items-center gap-1 rounded-sm border border-rosewood/30 px-3 py-1.5 text-xs text-rosewood">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <Modal title={form.id ? 'Edit stylist' : 'Add stylist'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input required placeholder="Full name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input required placeholder="Specialization" value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <textarea placeholder="Bio" rows={2} value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input type="number" min={0} placeholder="Years of experience" value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone">
              <ImagePlus className="h-4 w-4" />
              {file ? file.name : 'Upload photo (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (bookable on the public site)
            </label>

            <div>
              <p className="mb-2 text-sm font-medium">Working hours</p>
              <div className="space-y-1.5">
                {availability.map((d, i) => (
                  <div key={d.day_of_week} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0">{DAY_NAMES[d.day_of_week]}</span>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox" checked={!d.is_closed}
                        onChange={(e) => {
                          const next = [...availability];
                          next[i] = { ...d, is_closed: !e.target.checked };
                          setAvailability(next);
                        }}
                      /> Open
                    </label>
                    <input
                      type="time" value={d.start_time} disabled={d.is_closed}
                      onChange={(e) => { const next = [...availability]; next[i] = { ...d, start_time: e.target.value }; setAvailability(next); }}
                      className="rounded-sm border border-ink/20 px-1.5 py-1 disabled:opacity-40"
                    />
                    <span>–</span>
                    <input
                      type="time" value={d.end_time} disabled={d.is_closed}
                      onChange={(e) => { const next = [...availability]; next[i] = { ...d, end_time: e.target.value }; setAvailability(next); }}
                      className="rounded-sm border border-ink/20 px-1.5 py-1 disabled:opacity-40"
                    />
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-sm text-rosewood">{formError}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-sm bg-ink py-2.5 text-sm text-parchment disabled:opacity-50">
              {saving ? 'Saving…' : 'Save stylist'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
