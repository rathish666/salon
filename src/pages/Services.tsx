import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '@/lib/supabase';
import { ServiceCard } from '@/components/ServiceCard';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/StateViews';
import { useServices } from '@/hooks/usePublicData';
import type { ServiceCategory } from '@/types';

export function Services() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const { data: services, loading, error } = useServices(activeCategory);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('service_categories')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setCategoriesError(friendlyError(error, 'Could not load categories.'));
        else setCategories((data as ServiceCategory[]) ?? []);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl">Our services</h1>
      <p className="mt-2 max-w-xl text-stone">
        Every service includes a consultation. Prices reflect standard length and
        density — your stylist will confirm final pricing before starting.
      </p>

      {categoriesError && <p className="mt-4 text-sm text-rosewood">{categoriesError}</p>}

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(undefined)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-250 ${
            !activeCategory ? 'border-ink bg-ink text-parchment' : 'border-ink/20 hover:border-ink'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors duration-250 ${
              activeCategory === cat.id ? 'border-ink bg-ink text-parchment' : 'border-ink/20 hover:border-ink'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {loading ? (
          <LoadingSpinner label="Loading services…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : services.length === 0 ? (
          <EmptyState title="No services in this category yet" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
