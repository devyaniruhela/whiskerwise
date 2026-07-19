// Server → client boundary for Curated Essentials.
// lib/catalogue.ts imports `fs`, so no client component may import it. Server
// components map their data through here into plain serialisable objects.
import type { CatalogueItem, VariantGroup } from './catalogue';
import { buyHref, productImages, retailerName } from './catalogue';

export type VariantDTO = {
  id: string;
  /** what the swatch and the "Variant:" line read; never empty */
  label: string;
  brand: string;
  variant: string;
  itemType: string;
  description: string;
  images: string[];
  buyUrl: string;
  retailer: string;
  inStarterKit: boolean;
};

export function toVariantDTO(item: CatalogueItem): VariantDTO {
  return {
    id: item.id,
    // a blank variant would leave a swatch with no accessible name
    label: item.variant || item.item_type || 'Standard',
    brand: item.brand,
    variant: item.variant,
    itemType: item.item_type,
    description: item.description,
    images: productImages(item),
    buyUrl: buyHref(item),
    retailer: retailerName(item),
    inStarterKit: item.in_starter_kit,
  };
}

export function toVariantDTOs(group: VariantGroup): VariantDTO[] {
  return group.variants.map(toVariantDTO);
}
