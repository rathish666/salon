import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail loudly in dev rather than silently hitting an undefined backend.
  // eslint-disable-next-line no-console
  console.error(
    'Missing Supabase environment variables. Copy .env.example to .env and fill in your project URL and anon key.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Turns a Postgrest/Supabase error into a message safe to show customers. */
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (import.meta.env.DEV && error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return fallback;
}
