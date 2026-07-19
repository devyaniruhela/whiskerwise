'use client';

import Image from 'next/image';
import { useState } from 'react';

const STAMP = '/whisker-wise-logo-stamp-bw.png';

/** Product photo with a client-side fallback to the Whisker Wise stamp.
 *  next/image has no server-side onError for statically generated pages, so a
 *  product whose Cloudinary upload is missing would otherwise render a broken
 *  image. This keeps a missing photo looking deliberate instead. */
export function ProductImage({
  src,
  alt,
  sizes,
  className = 'object-cover',
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full items-center justify-center">
        <Image src={STAMP} alt="" width={88} height={88} className="opacity-35" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
