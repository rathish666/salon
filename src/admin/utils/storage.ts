import { supabase } from '@/lib/supabase';

/**
 * Uploads a file to a public Supabase Storage bucket and returns its public URL.
 * Used by Services, Staff, and Gallery admin forms.
 */
export async function uploadImage(bucket: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (uploadError) {
    return { url: null, error: 'Could not upload the image. Please try a smaller file or check your connection.' };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/** Deletes an image from storage given its public URL, best-effort (ignores failures). */
export async function deleteImageByUrl(bucket: string, publicUrl: string): Promise<void> {
  const marker = `/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(bucket).remove([path]);
}
