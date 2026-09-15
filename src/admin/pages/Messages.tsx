import { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { supabase, friendlyError } from '@/lib/supabase';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import type { ContactMessage } from '@/types';

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) setError(friendlyError(error, 'Could not load messages.'));
    else setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleRead(m: ContactMessage) {
    const { error } = await supabase.from('contact_messages').update({ is_read: !m.is_read }).eq('id', m.id);
    if (!error) setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_read: !x.is_read } : x)));
  }

  async function handleDelete(m: ContactMessage) {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('contact_messages').delete().eq('id', m.id);
    if (!error) setMessages((prev) => prev.filter((x) => x.id !== m.id));
  }

  return (
    <div>
      <h1 className="text-2xl">Contact messages</h1>
      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : messages.length === 0 ? (
          <EmptyState title="No messages yet" />
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`rounded-lg border p-4 ${m.is_read ? 'border-ink/10 bg-white' : 'border-champagne bg-champagne/10'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-stone">{m.email}{m.phone ? ` · ${m.phone}` : ''}</p>
                    <p className="mt-2 text-sm">{m.message}</p>
                    <p className="mt-2 text-xs text-stone">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => toggleRead(m)} className="rounded-sm border border-ink/20 p-2" aria-label={m.is_read ? 'Mark unread' : 'Mark read'}>
                      {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </button>
                    <button onClick={() => handleDelete(m)} className="rounded-sm border border-rosewood/30 p-2 text-rosewood" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
