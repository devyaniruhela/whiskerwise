'use client';

import { useState } from 'react';
import Image from 'next/image';

/** Product-detail image gallery: main image + thumbnail strip. Built for the
 *  one-product-many-images model (PRD §4): works with a single image today and
 *  grows into the Cloudinary per-product folder with no changes here. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-sel/40 shadow-raised">
        <Image
          key={images[active]}
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(min-width: 768px) 45vw, 90vw"
          className="animate-fade-up object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="scrollbar-thin mt-3 flex gap-2.5 overflow-x-auto pb-1" role="listbox" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="option"
              aria-selected={i === active}
              aria-label={`Image ${i + 1} of ${images.length}`}
              onClick={() => setActive(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition-colors ${
                i === active ? 'border-iron' : 'border-hairline hover:border-hairline-strong'
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
