// Curated Essentials data layer: server-only (fs read at build/render time).
// Single source of truth: content/curated-essentials.csv at the repo root
// (sibling of kb/, per Curated_Essentials_PRD.md §4). No product data lives in components.
import fs from 'fs';
import path from 'path';

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
  source_suffix: string;
  in_starter_kit: boolean;
  sort: string;
  active: boolean;
  date_added: string;
};

export type CategorySection = { category: string; items: CatalogueItem[] };

// Section display order (PRD §3). Unknown categories append after, in CSV order.
export const CATEGORY_ORDER = [
  'Food & feeding',
  'Toppers & treats',
  'Carrier & outdoor',
  'Litter',
  'Enrichment',
] as const;

// ── Cloudinary (PRD §4) ──────────────────────────────────────────────────────
// D hasn't created the Cloudinary account yet. When she does: set CLOUD_NAME,
// upload each product's images under `curated-essentials/<id>/` (public-ids
// <id>/1, <id>/2, …) and the resolver below picks them up: no CSV edits.
const CLOUD_NAME = ''; // e.g. 'whiskerwise': empty ⇒ placeholder for every product
const CLOUD_FOLDER = 'curated-essentials';
export const PLACEHOLDER_IMAGE = '/whisker-wise-logo-stamp-bw.png';

/** Image set for a product: explicit image_url wins → Cloudinary by convention → []. */
export function productImages(item: CatalogueItem): string[] {
  if (item.image_url) return [item.image_url];
  if (CLOUD_NAME) {
    // First image of the per-product folder; gallery can extend to /2, /3 … later.
    return [
      `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${CLOUD_FOLDER}/${item.id}/1`,
    ];
  }
  return []; // no real imagery yet: cards render their item-type block instead
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

export function retailerName(item: CatalogueItem): string {
  try {
    const host = new URL(item.buy_url).hostname.replace(/^www\./, '');
    if (/amazon/i.test(host)) return 'Amazon';
    if (/headsupfortails/i.test(host)) return 'Heads Up For Tails';
    return host;
  } catch {
    return 'the store';
  }
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
  // process.cwd() is app/frontend in dev/build; the CSV lives at the repo root.
  const candidates = [
    path.join(process.cwd(), '..', '..', 'content', 'curated-essentials.csv'),
    path.join(process.cwd(), 'content', 'curated-essentials.csv'),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error(`curated-essentials.csv not found; tried: ${candidates.join(' · ')}`);
}

function loadItems(): CatalogueItem[] {
  const [header, ...rows] = parseCsv(fs.readFileSync(csvPath(), 'utf8'));
  const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const get = (r: string[], col: string) => (r[idx[col]] ?? '').trim();
  return rows
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
      source_suffix: get(r, 'source_suffix'),
      in_starter_kit: get(r, 'in_starter_kit').toUpperCase() === 'TRUE',
      sort: get(r, 'sort'),
      active: get(r, 'active').toUpperCase() === 'TRUE',
      date_added: get(r, 'date_added'),
    }))
    .filter((it) => it.id && it.active);
}

function bySort(a: CatalogueItem, b: CatalogueItem): number {
  const sa = a.sort === '' ? Infinity : Number(a.sort);
  const sb = b.sort === '' ? Infinity : Number(b.sort);
  return sa !== sb ? sa - sb : a.row - b.row; // explicit sort first, else CSV (curation) order
}

/** Active items grouped for the catalogue page: starter kit + ordered category sections. */
export function getCatalogue(): { starterKit: CatalogueItem[]; sections: CategorySection[] } {
  const items = loadItems();
  const known = new Map<string, CatalogueItem[]>();
  for (const it of items) {
    const list = known.get(it.item_category) ?? [];
    list.push(it);
    known.set(it.item_category, list);
  }
  const orderedNames = [
    ...CATEGORY_ORDER.filter((c) => known.has(c)),
    ...[...known.keys()].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
  ];
  return {
    starterKit: items.filter((it) => it.in_starter_kit).sort(bySort),
    sections: orderedNames.map((category) => ({
      category,
      items: (known.get(category) ?? []).sort(bySort),
    })),
  };
}

export function getItem(id: string): CatalogueItem | undefined {
  return loadItems().find((it) => it.id === id);
}

export function getAllIds(): string[] {
  return loadItems().map((it) => it.id);
}
