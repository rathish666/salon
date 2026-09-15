import type { GalleryImage } from '@/types';

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img) => (
        <figure key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-stone/20">
          <img
            src={img.image_url}
            alt={img.caption ?? img.category}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {img.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-ink/60 p-2 text-xs text-parchment opacity-0 transition-opacity duration-250 group-hover:opacity-100">
              {img.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
