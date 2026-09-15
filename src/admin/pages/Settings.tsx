import { useEffect, useState, FormEvent } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { uploadImage } from '@/admin/utils/storage';
import { LoadingSpinner, ErrorState } from '@/components/StateViews';
import type { SalonSettings, OpeningHour } from '@/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BUCKET = 'service-images'; // logo shares the same public bucket set

function defaultHours(): OpeningHour[] {
  return DAY_NAMES.map((_, day) => ({
    day_of_week: day,
    open_time: '09:00',
    close_time: '20:00',
    is_closed: day === 0,
  }));
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [hours, setHours] = useState<OpeningHour[]>(defaultHours());
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('salon_settings').select('*').limit(1).maybeSingle();
    if (error || !data) { setError(friendlyError(error, 'Could not load settings.')); setLoading(false); return; }
    setSettings(data as SalonSettings);
    const storedHours = (data.opening_hours as OpeningHour[]) ?? [];
    setHours(storedHours.length === 7 ? storedHours : defaultHours());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaveMessage(null);

    let logoUrl = settings.logo_url;
    if (logoFile) {
      const { url, error } = await uploadImage(BUCKET, logoFile);
      if (error) { setSaveMessage(error); setSaving(false); return; }
      logoUrl = url;
    }

    const { error } = await supabase.from('salon_settings').update({
      salon_name: settings.salon_name,
      logo_url: logoUrl,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      address: settings.address,
      google_maps_url: settings.google_maps_url,
      min_booking_notice_hours: settings.min_booking_notice_hours,
      max_advance_booking_days: settings.max_advance_booking_days,
      opening_hours: hours,
    }).eq('id', settings.id);

    setSaving(false);
    setSaveOk(!error);
    setSaveMessage(error ? friendlyError(error, 'Could not save settings.') : 'Settings saved.');
    if (!error) load();
  }

  if (loading) return <LoadingSpinner />;
  if (error || !settings) return <ErrorState message={error ?? 'Settings unavailable.'} onRetry={load} />;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl">Salon settings</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section>
          <h2 className="font-display text-lg">Business information</h2>
          <div className="mt-3 space-y-3">
            <input placeholder="Salon name" value={settings.salon_name}
              onChange={(e) => setSettings({ ...settings, salon_name: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone">
              {logoFile ? logoFile.name : settings.logo_url ? 'Replace logo' : 'Upload logo (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </label>
            <input placeholder="Phone" value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input placeholder="WhatsApp number (digits with country code)" value={settings.whatsapp}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input placeholder="Email" value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <textarea placeholder="Address" rows={2} value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            <input placeholder="Google Maps URL" value={settings.google_maps_url ?? ''}
              onChange={(e) => setSettings({ ...settings, google_maps_url: e.target.value })}
              className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg">Opening hours</h2>
          <div className="mt-3 space-y-1.5">
            {hours.map((h, i) => (
              <div key={h.day_of_week} className="flex items-center gap-2 text-sm">
                <span className="w-20 shrink-0">{DAY_NAMES[h.day_of_week]}</span>
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={!h.is_closed}
                    onChange={(e) => { const next = [...hours]; next[i] = { ...h, is_closed: !e.target.checked }; setHours(next); }} />
                  Open
                </label>
                <input type="time" value={h.open_time ?? '09:00'} disabled={h.is_closed}
                  onChange={(e) => { const next = [...hours]; next[i] = { ...h, open_time: e.target.value }; setHours(next); }}
                  className="rounded-sm border border-ink/20 px-1.5 py-1 text-xs disabled:opacity-40" />
                <span>–</span>
                <input type="time" value={h.close_time ?? '20:00'} disabled={h.is_closed}
                  onChange={(e) => { const next = [...hours]; next[i] = { ...h, close_time: e.target.value }; setHours(next); }}
                  className="rounded-sm border border-ink/20 px-1.5 py-1 text-xs disabled:opacity-40" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg">Booking rules</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-sm">
              Minimum notice (hours)
              <input type="number" min={0} value={settings.min_booking_notice_hours}
                onChange={(e) => setSettings({ ...settings, min_booking_notice_hours: Number(e.target.value) })}
                className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">
              Max advance booking (days)
              <input type="number" min={1} value={settings.max_advance_booking_days}
                onChange={(e) => setSettings({ ...settings, max_advance_booking_days: Number(e.target.value) })}
                className="mt-1 w-full rounded-sm border border-ink/20 px-3 py-2 text-sm" />
            </label>
          </div>
        </section>

        {saveMessage && <p className={`text-sm ${saveOk ? 'text-oak' : 'text-rosewood'}`}>{saveMessage}</p>}
        <button type="submit" disabled={saving} className="rounded-sm bg-ink px-6 py-2.5 text-sm text-parchment disabled:opacity-50">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
