// Curated Essentials data layer: server-only (fs read at build/render time).
// Single source of truth: app/frontend/content/curated-essentials.csv
// (sibling of kb/, per Curated_Essentials_PRD.md §4). No product data lives in components.
import fs from 'fs';
import path from 'path';

export type LifeStage = 'adult' | 'kitten' | 'all';

export type CatalogueItem = {
  /** original CSV row position: the curation order, used as the sort fallback */
  row: number;
  id: string;
  item_category: string;
  item_type: string;
  title: string;
  brand: string;
  variant: string;
  description: string;
  buy_url: string;
  image_url: string;
  /** how many images exist as `<id>-1 … <id>-n` in Cloudinary; blank ⇒ 1 */
  image_count: number;
  /** blank ⇒ 'all': the item is life-stage independent and always shows */
  life_stage: LifeStage;
  source_suffix: string;
  in_starter_kit: boolean;
  sort: string;
  active: boolean;
  date_added: string;
};

/** One tile. Near-duplicate CSV rows collapse into a single product with variants. */
export type VariantGroup = {
  /** stable slug, unique across the catalogue */
  key: string;
  title: string;
  /** '' when the group is brand-less (grouped on title alone) */
  brand: string;
  item_category: string;
  item_type: string;
  /** ≥1, in bySort order */
  variants: CatalogueItem[];
  /** variants[0]: drives the tile image, blurb and the PDP's default selection */
  primary: CatalogueItem;
  inStarterKit: boolean;
};

export type Need = { name: string; slug: string; count: number };
export type CategorySection = { category: string; groups: VariantGroup[] };

// Section display order (D, 18 Jul 2026). Unknown categories append after, in CSV order.
export const CATEGORY_ORDER = [
  'Food & feeding',
  'Litter',
  'Toys & enrichment',
  'Toppers & treats',
  'Carrier & outdoor',
] as const;

/** Category names carry '&' and spaces, so URLs and DOM ids use slugs instead. */
export function categorySlug(name: string): string {
  return slug(name);
}

export function categoryFromSlug(s: string, categories: string[]): string | undefined {
  return categories.find((c) => categorySlug(c) === s);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Cloudinary ───────────────────────────────────────────────────────────────
// Public ids are exactly `<csv-id>-<n>`, n from 1, at the root of the account
// (no folder, no version, no extension: Cloudinary serves the original format).
// Delivery is capped with c_limit,w_1600 and nothing else. Deliberately NO
// f_auto/q_auto: next/image re-encodes server-side anyway, so f_auto would
// negotiate against the Next server's Accept header rather than the browser's,
// and q_auto would stack a second lossy pass for no size win.
const CLOUD_NAME = 'dksnlowb1';
/** Kill switch: set NEXT_PUBLIC_ESSENTIALS_IMAGES=off to fall back to the stamp. */
const IMAGES_ENABLED = process.env.NEXT_PUBLIC_ESSENTIALS_IMAGES !== 'off';

export const LOGO_STAMP_IMAGE = '/whisker-wise-logo-stamp-bw.png';
/** Kept under the old name: several components already import it. */
export const PLACEHOLDER_IMAGE = LOGO_STAMP_IMAGE;

export function imageUrl(id: string, n: number): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_limit,w_1600/${id}-${n}`;
}

/** Image set for a product: explicit image_url override wins, else by convention. */
export function productImages(item: CatalogueItem): string[] {
  if (item.image_url) return [item.image_url];
  if (!IMAGES_ENABLED) return [];
  return Array.from({ length: item.image_count }, (_, i) => imageUrl(item.id, i + 1));
}

// ── Buy link (PRD §5) ────────────────────────────────────────────────────────
// UTM suffix is appended only when the row carries one; Amazon short-links strip
// query params on redirect, so their rows have a blank source_suffix and we also
// guard on the host as belt-and-suspenders.
export function buyHref(item: CatalogueItem): string {
  const url = item.buy_url;
  if (!item.source_suffix) return url;
  if (/(^|\.)link\.amazon\//i.test(url.replace(/^https?:\/\//i, ''))) return url;
  const [base, hash] = url.split('#');
  const joined = base.includes('?') ? `${base}&${item.source_suffix}` : `${base}?${item.source_suffix}`;
  return hash ? `${joined}#${hash}` : joined;
}

const RETAILERS: [RegExp, string][] = [
  [/amazon|amzn/i, 'Amazon'],
  [/headsupfortails/i, 'Heads Up For Tails'],
  [/supertails/i, 'Supertails'],
  [/shakehands/i, 'Shake Hands'],
];

export function retailerName(item: CatalogueItem): string {
  try {
    const host = new URL(item.buy_url).hostname.replace(/^www\./, '');
    for (const [re, name] of RETAILERS) if (re.test(host)) return name;
    // never surface a raw hostname: strip the TLD and title-case what's left
    const stem = host.split('.')[0] ?? host;
    return stem.charAt(0).toUpperCase() + stem.slice(1);
  } catch {
    return 'the store';
  }
}

// ── Kitten mode ──────────────────────────────────────────────────────────────
// Only rows explicitly tagged `adult` are hidden. Blank life_stage means the item
// is life-stage independent (litter, toys, carriers) and always shows.
export function hiddenWhenKitten(it: CatalogueItem): boolean {
  return it.life_stage === 'adult';
}

/** A group disappears only when every one of its variants is adult-only. */
export function groupHiddenWhenKitten(g: VariantGroup): boolean {
  return g.variants.every(hiddenWhenKitten);
}

// ── CSV read (tiny RFC-4180 parser: quoted fields contain commas) ──────────
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

function csvPath(): string {
  // process.cwd() is app/frontend in dev and in the Vercel build.
  //
  // This file MUST live inside app/frontend. Vercel's Root Directory is set to
  // app/frontend, so the build sandbox contains that subtree only - a CSV at the
  // repo root is invisible to the build even when it is committed and pushed
  // (19 Jul 2026: that exact mistake cost three failed deploys).
  const p = path.join(process.cwd(), 'content', 'curated-essentials.csv');
  if (fs.existsSync(p)) return p;
  throw new Error(
    `curated-essentials.csv not found at ${p}. It must live inside app/frontend/ ` +
      `(Vercel Root Directory = app/frontend; anything above it is not in the build).`,
  );
}

// Memoized: generateStaticParams + one render per product used to re-read and
// re-parse the whole CSV on every call. Keyed on mtime in dev so `next dev` still
// picks up CSV edits; a constant in prod. NOT React.cache(), which is per-request
// and would not persist across the SSG renders in a build worker.
let cachedPath: string | null = null;
let cache: { key: number; items: CatalogueItem[]; groups: VariantGroup[] } | null = null;

function cacheKey(p: string): number {
  return process.env.NODE_ENV === 'production' ? 0 : fs.statSync(p).mtimeMs;
}

function parseLifeStage(raw: string): LifeStage {
  const v = raw.trim().toLowerCase();
  return v === 'adult' || v === 'kitten' ? v : 'all';
}

function loadItems(): CatalogueItem[] {
  return loadAll().items;
}

function loadAll(): { items: CatalogueItem[]; groups: VariantGroup[] } {
  const p = (cachedPath ??= csvPath());
  const key = cacheKey(p);
  if (cache?.key === key) return cache;

  const [header, ...rows] = parseCsv(fs.readFileSync(p, 'utf8'));
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const get = (r: string[], col: string) => (r[idx[col]] ?? '').trim();

  const items = rows
    .map((r, row) => ({
      row,
      id: get(r, 'id'),
      item_category: get(r, 'item_category'),
      item_type: get(r, 'item_type'),
      title: get(r, 'title'),
      brand: get(r, 'brand'),
      variant: get(r, 'variant'),
      description: get(r, 'description'),
      buy_url: get(r, 'buy_url'),
      image_url: get(r, 'image_url'),
      image_count: Math.max(0, Number(get(r, 'image_count')) || 0),
      life_stage: parseLifeStage(get(r, 'life_stage')),
      source_suffix: get(r, 'source_suffix'),
      in_starter_kit: get(r, 'in_starter_kit').toUpperCase() === 'TRUE',
      sort: get(r, 'sort'),
      active: get(r, 'active').toUpperCase() === 'TRUE',
      date_added: get(r, 'date_added'),
    }))
    // inactive rows are dropped BEFORE grouping, so an inactive variant simply
    // does not exist and a fully-inactive product vanishes from the catalogue
    .filter((it) => it.id && it.active);

  const groups = buildGroups(items);
  cache = { key, items, groups };
  return cache;
}

function bySort(a: CatalogueItem, b: CatalogueItem): number {
  const sa = a.sort === '' ? Infinity : Number(a.sort);
  const sb = b.sort === '' ? Infinity : Number(b.sort);
  return sa !== sb ? sa - sb : a.row - b.row; // explicit sort first, else CSV (curation) order
}

// ── Variant grouping ─────────────────────────────────────────────────────────
// Rows collapse into one product when they share a title AND a brand. When the
// brand is blank (litter boxes, wand toys) the title alone is the key, so those
// still group. Two same-titled products from different brands stay separate
// tiles, which is what keeps the variant swatches meaningful (D, 18 Jul 2026).
function groupKeyOf(it: CatalogueItem): string {
  const t = slug(it.title);
  return it.brand ? `${t}--${slug(it.brand)}` : t;
}

function buildGroups(items: CatalogueItem[], keyOf = groupKeyOf): VariantGroup[] {
  const byKey = new Map<string, CatalogueItem[]>();
  for (const it of items) {
    const k = keyOf(it);
    const list = byKey.get(k) ?? [];
    list.push(it);
    byKey.set(k, list);
  }
  return [...byKey.entries()].map(([key, list]) => {
    const variants = [...list].sort(bySort);
    const primary = variants[0];
    return {
      key,
      title: primary.title,
      brand: primary.brand,
      item_category: primary.item_category,
      item_type: primary.item_type,
      variants,
      primary,
      inStarterKit: variants.some((v) => v.in_starter_kit),
    };
  });
}

/** Category order first, then alphabetical by title within each. */
function orderGroups(groups: VariantGroup[]): VariantGroup[] {
  const rank = (c: string) => {
    const i = (CATEGORY_ORDER as readonly string[]).indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i; // unknown categories sort last
  };
  return [...groups].sort(
    (a, b) =>
      rank(a.item_category) - rank(b.item_category) ||
      a.item_category.localeCompare(b.item_category) ||
      a.title.localeCompare(b.title) ||
      a.brand.localeCompare(b.brand),
  );
}

export function getGroups(): VariantGroup[] {
  return orderGroups(loadAll().groups);
}

export function getNeeds(): Need[] {
  const groups = getGroups();
  const seen = new Map<string, number>();
  for (const g of groups) seen.set(g.item_category, (seen.get(g.item_category) ?? 0) + 1);
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => seen.has(c)),
    ...[...seen.keys()].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
  ];
  return ordered.map((name) => ({ name, slug: categorySlug(name), count: seen.get(name) ?? 0 }));
}

/** The starter kit groups on TITLE alone, so "N items" counts unique titles (D). */
export function getStarterKit(): VariantGroup[] {
  const kitItems = loadItems().filter((it) => it.in_starter_kit);
  return orderGroups(buildGroups(kitItems, (it) => slug(it.title)));
}

export function getCatalogue(): { starterKit: VariantGroup[]; sections: CategorySection[] } {
  const groups = getGroups();
  const needs = getNeeds();
  return {
    starterKit: getStarterKit(),
    sections: needs.map(({ name }) => ({
      category: name,
      groups: groups.filter((g) => g.item_category === name),
    })),
  };
}

/** The product a given variant id belongs to: powers the PDP. */
export function getGroupByItemId(id: string): VariantGroup | undefined {
  return loadAll().groups.find((g) => g.variants.some((v) => v.id === id));
}

export function getItem(id: string): CatalogueItem | undefined {
  return loadItems().find((it) => it.id === id);
}

export function getAllIds(): string[] {
  return loadItems().map((it) => it.id);
}
