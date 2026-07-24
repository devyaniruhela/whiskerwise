/** The "brand · variant" sub-line under a product title.
 *
 *  Two rules, both learned from real rows rather than invented:
 *   - when the product has siblings, the variant belongs to the selector, not
 *     here, or the card would name a choice the reader has not made yet;
 *   - when the variant just repeats the brand it is dropped. `hard-carrier-savic`
 *     carries brand "Savic" and variant "Savic", which rendered as
 *     "Savic · Savic" and reads like a bug (spotted in D's screen recording,
 *     19 Jul 2026).
 *
 *  Client-safe on purpose: no import from lib/catalogue, which pulls in `fs`. */
export function brandLine(brand: string, variant: string, hasSiblings: boolean): string {
  const repeatsBrand = variant.trim().toLowerCase() === brand.trim().toLowerCase();
  const v = hasSiblings || repeatsBrand ? '' : variant;
  return [brand, v].filter(Boolean).join(' · ');
}
