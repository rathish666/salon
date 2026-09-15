import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import type { Service, Staff, GalleryImage, Testimonial } from '@/types';

interface FetchState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export function useServices(categoryId?: string) {
  const [state, setState] = useState<FetchState<Service[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState((s) => ({ ...s, loading: true, error: null }));
      let query = supabase
        .from('services')
        .select('*, category:service_categories(*)')
        .eq('is_active', true)
        .order('name');
      if (categoryId) query = query.eq('category_id', categoryId);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: friendlyError(error, 'Could not load services right now.') });
      else setState({ data: (data as Service[]) ?? [], loading: false, error: null });
    }
    load();
    return () => { cancelled = true; };
  }, [categoryId]);

  return state;
}

export function useStaff() {
  const [state, setState] = useState<FetchState<Staff[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: friendlyError(error, 'Could not load our stylists right now.') });
      else setState({ data: (data as Staff[]) ?? [], loading: false, error: null });
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}

export function useGallery(category?: string) {
  const [state, setState] = useState<FetchState<GalleryImage[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let query = supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (category) query = query.eq('category', category);
      const { data, error } = await query;
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: friendlyError(error, 'Could not load the gallery right now.') });
      else setState({ data: (data as GalleryImage[]) ?? [], loading: false, error: null });
    }
    load();
    return () => { cancelled = true; };
  }, [category]);

  return state;
}

export function useTestimonials() {
  const [state, setState] = useState<FetchState<Testimonial[]>>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_published', true)
        .order('review_date', { ascending: false })
        .limit(9);
      if (cancelled) return;
      if (error) setState({ data: [], loading: false, error: friendlyError(error, 'Could not load reviews right now.') });
      else setState({ data: (data as Testimonial[]) ?? [], loading: false, error: null });
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
