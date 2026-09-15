import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminLogin() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && isAdmin) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) setError('Invalid email or password.');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-parchment p-8">
        <h1 className="font-display text-2xl text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-stone">Velvet & Oak Salon dashboard</p>

        <div className="mt-6 space-y-4">
          <input
            type="email" required placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
          />
          <input
            type="password" required placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-ink/20 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="mt-4 text-sm text-rosewood">{error}</p>}

        <button
          type="submit" disabled={submitting}
          className="mt-6 w-full rounded-sm bg-ink py-2.5 text-sm font-medium text-parchment disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
