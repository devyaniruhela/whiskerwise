'use client';

import Link from 'next/link';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { track, type AnalyticsParams } from '@/lib/analytics';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  /** what this CTA is, e.g. 'view_pick', 'where_to_get_this', 'browse_essentials' */
  ctaName: string;
  /** extra event params (page, section, product_*, destination) merged into the click */
  params?: AnalyticsParams;
  /** true → outbound <a target="_blank">; omitted → internal next/link navigation */
  external?: boolean;
  children?: ReactNode;
};

/** A link that logs one `cta_click` before it navigates - the single primitive
 *  for tracking navigation on every page, internal or outbound, so no page wires
 *  analytics by hand. `cta_type` is set automatically. Being a client component
 *  it still drops inside SERVER components (ProductCard, the essentials landing)
 *  because its props are all serialisable. */
export function TrackedLink({ href, ctaName, params, external, onClick, children, ...rest }: Props) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    track('cta_click', {
      cta_name: ctaName,
      cta_type: external ? 'outbound' : 'internal',
      ...params,
    });
    onClick?.(e);
  }

  // defaults first, so a caller can still override target/rel via ...rest
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest} onClick={handle}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} {...rest} onClick={handle}>
      {children}
    </Link>
  );
}
