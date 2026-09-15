import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-stone">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-stone">
      <Inbox className="h-8 w-8" aria-hidden="true" />
      <p className="font-display text-lg text-ink">{title}</p>
      {message && <p className="max-w-sm text-sm">{message}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-rosewood" aria-hidden="true" />
      <p className="max-w-sm text-sm text-ink">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
