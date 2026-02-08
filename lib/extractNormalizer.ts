/**
 * Normalize webhook extract (snake_case or mixed) to ExtractedData.
 * Missing or null values stay null/empty/0/false as appropriate.
 */

import type { ExtractedData } from '@/types';

function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

function bool(v: unknown): boolean {
  if (v == null) return false;
  return v === true || v === 'true' || v === 1;
}

function boolOrNull(v: unknown): boolean | null {
  if (v == null) return null;
  if (v === true || v === 'true' || v === 1) return true;
  if (v === false || v === 'false' || v === 0) return false;
  return null;
}

function arrStr(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => (x != null ? String(x) : ''));
  return [];
}

function obj(v: unknown): Record<string, unknown> {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

/** Get value from raw object by snake_case or camelCase key */
function get(raw: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (raw[k] !== undefined) return raw[k];
  }
  return undefined;
}

export function normalizeWebhookExtract(raw: Record<string, unknown>): ExtractedData {
  const ga = obj(get(raw, 'guaranteed_analysis', 'guaranteedAnalysis'));
  const gaOthers = Array.isArray(ga.others) ? ga.others : [];

  return {
    brand: str(get(raw, 'brand')),
    variant: str(get(raw, 'variant')),
    lifestage: str(get(raw, 'lifestage')),
    type: str(get(raw, 'type')),
    typeMethod: str(get(raw, 'type_method', 'typeMethod')),
    adequacy: str(get(raw, 'adequacy')),
    texture: get(raw, 'texture') != null ? str(get(raw, 'texture')) : null,
    aafcoCertified: bool(get(raw, 'aafco_certified', 'aafcoCertified')),
    otherCertifications: arrStr(get(raw, 'other_certifications', 'otherCertifications')),
    claims: arrStr(get(raw, 'claims')),
    intendedUse: get(raw, 'intended_use', 'intendedUse') != null ? str(get(raw, 'intended_use', 'intendedUse')) : null,
    ingredients: arrStr(get(raw, 'ingredients')),
    additives: get(raw, 'additives') != null ? arrStr(get(raw, 'additives')) : null,
    guaranteedAnalysis: {
      protein: get(ga, 'protein') != null ? num(get(ga, 'protein')) : null,
      fat: get(ga, 'fat') != null ? num(get(ga, 'fat')) : null,
      fibre: get(ga, 'fibre', 'fiber') != null ? num(get(ga, 'fibre', 'fiber')) : null,
      ash: get(ga, 'ash') != null ? num(get(ga, 'ash')) : null,
      moisture: get(ga, 'moisture') != null ? num(get(ga, 'moisture')) : null,
      others: gaOthers.map(toGaOtherExactString).filter((o) => o.label.length > 0),
    },
    taurineAdded: boolOrNull(get(raw, 'taurine_added', 'taurineAdded')),
    weight: get(raw, 'weight') != null ? num(get(raw, 'weight')) : null,
    price: get(raw, 'price') != null ? num(get(raw, 'price')) : null,
    priceCurrency: str(get(raw, 'price_currency', 'priceCurrency')) || 'INR',
    metEnergy100g: get(raw, 'met_energy_100g', 'metEnergy100g') != null ? str(get(raw, 'met_energy_100g', 'metEnergy100g')) : null,
    manufacturerName: get(raw, 'manufacturer_name', 'manufacturerName') != null ? str(get(raw, 'manufacturer_name', 'manufacturerName')) : null,
    manufacturerContact: get(raw, 'manufacturer_contact', 'manufacturerContact') != null ? str(get(raw, 'manufacturer_contact', 'manufacturerContact')) : null,
    countryOrigin: get(raw, 'country_of_origin', 'countryOrigin') != null ? str(get(raw, 'country_of_origin', 'countryOrigin')) : null,
    dateManufacture: get(raw, 'date_manufacture', 'dateManufacture') != null ? str(get(raw, 'date_manufacture', 'dateManufacture')) : null,
    dateExpiry: get(raw, 'date_expiry', 'dateExpiry') != null ? str(get(raw, 'date_expiry', 'dateExpiry')) : null,
    translatedFlag: bool(get(raw, 'translated_flag', 'translatedFlag')),
    confidence: get(raw, 'confidence') != null ? num(get(raw, 'confidence')) : null,
  };
}

/** N8n success response: [{ status, analysis_id, extracted_data: [ {...}, {...} ], timestamp }] */
function isN8nSuccessArray(data: unknown): data is Array<{ status?: string; extracted_data?: unknown[] }> {
  return Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] != null && (data[0] as { status?: string }).status === 'success';
}

/** N8n error response: [{ all_passed: false, images: [{ image_id, category, error_codes[] }, ...] }] */
export function isN8nErrorArray(data: unknown): data is Array<{ all_passed?: boolean; images?: Array<{ image_id?: string; category?: string; error_codes?: string[] }> }> {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] != null &&
    (data[0] as { all_passed?: boolean }).all_passed === false
  );
}

/** Parse weight from number or string like "50g" -> 50 */
function parseWeight(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).trim();
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

/** Map GA "others" item to { label, value } using exact string value as sent (no numeric conversion or % parsing). */
function toGaOtherExactString(o: unknown): { label: string; value: string } {
  if (o == null || typeof o !== 'object') return { label: '', value: '' };
  const obj = o as Record<string, unknown>;
  const nutrientName = obj.nutrient_name != null ? String(obj.nutrient_name).trim() : null;
  const val = obj.value;
  if (nutrientName != null && nutrientName.length > 0 && val != null) {
    return { label: nutrientName, value: String(val).trim() };
  }
  const entries = Object.entries(obj).filter(([k]) => k !== 'nutrient_name' && k !== 'value');
  const first = entries[0];
  if (first) {
    const [key, v] = first;
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, value: v != null ? String(v) : '' };
  }
  return { label: '', value: '' };
}

/** Map one n8n extracted_data item (brand_name, type_of_food, etc.) to our shape. GA primary fields are already in %. */
function normalizeN8nItem(item: Record<string, unknown>): Partial<ExtractedData> {
  const ga = obj(item.guaranteed_analysis);
  const gaOthers = Array.isArray(ga.others) ? ga.others : [];
  return {
    brand: str(item.brand_name),
    variant: item.variant != null ? str(item.variant) : '',
    lifestage: str(item.life_stage),
    type: str(item.type_of_food),
    typeMethod: '', // not in n8n item
    adequacy: str(item.adequacy),
    texture: item.texture != null ? str(item.texture) : null,
    aafcoCertified: item.aafco_statement != null && str(item.aafco_statement).length > 0,
    otherCertifications: [],
    claims: arrStr(item.claims),
    intendedUse: item.intended_use != null ? str(item.intended_use) : null,
    ingredients: arrStr(item.ingredients),
    additives: item.additives != null ? arrStr(item.additives) : null,
    guaranteedAnalysis: {
      protein: get(ga, 'protein') != null ? num(get(ga, 'protein')) : null,
      fat: get(ga, 'fat') != null ? num(get(ga, 'fat')) : null,
      fibre: get(ga, 'fibre', 'fiber') != null ? num(get(ga, 'fibre', 'fiber')) : null,
      ash: get(ga, 'ash') != null ? num(get(ga, 'ash')) : null,
      moisture: get(ga, 'moisture') != null ? num(get(ga, 'moisture')) : null,
      others: gaOthers.map(toGaOtherExactString).filter((o) => o.label.length > 0),
    },
    taurineAdded: null,
    weight: item.weight != null ? parseWeight(item.weight) : null,
    price: (() => {
      if (item.price == null) return null;
      const n =
        typeof item.price === 'string'
          ? parseFloat(String(item.price).replace(/[^\d.]/g, ''))
          : num(item.price);
      return Number.isNaN(n) ? null : n;
    })(),
    priceCurrency: 'INR',
    metEnergy100g: item.metabolic_energy != null ? str(item.metabolic_energy) : null,
    manufacturerName: item.manufacturer_name != null ? str(item.manufacturer_name) : null,
    manufacturerContact: null,
    countryOrigin: item.country_of_origin != null ? str(item.country_of_origin) : null,
    dateManufacture: item.manufacturing_date != null ? str(item.manufacturing_date) : null,
    dateExpiry: item.date_of_expiry != null ? str(item.date_of_expiry) : null,
    translatedFlag: bool(item.translated_flag),
    confidence: item.confidence != null ? num(item.confidence) : null,
  };
}

function mergeArrays(...arrs: (string[] | null | undefined)[]): string[] {
  const out: string[] = [];
  for (const a of arrs) {
    if (Array.isArray(a)) for (const x of a) if (x != null && String(x).trim()) out.push(String(x).trim());
  }
  return out;
}

/** Merge multiple n8n extracted_data items into one ExtractedData (prefer first non-empty per field). */
function mergeN8nItems(items: Record<string, unknown>[]): ExtractedData {
  const partials = items.map((i) => normalizeN8nItem(i));
  const base: ExtractedData = {
    brand: '',
    variant: '',
    lifestage: '',
    type: '',
    typeMethod: '',
    adequacy: '',
    texture: null,
    aafcoCertified: false,
    otherCertifications: [],
    claims: [],
    intendedUse: null,
    ingredients: [],
    additives: null,
    guaranteedAnalysis: { protein: null, fat: null, fibre: null, ash: null, moisture: null, others: [] },
    taurineAdded: null,
    weight: null,
    price: null,
    priceCurrency: 'INR',
    metEnergy100g: null,
    manufacturerName: null,
    manufacturerContact: null,
    countryOrigin: null,
    dateManufacture: null,
    dateExpiry: null,
    translatedFlag: false,
  };
  for (const p of partials) {
    if (!base.brand && p.brand) base.brand = p.brand;
    if (!base.variant && p.variant) base.variant = p.variant;
    if (!base.lifestage && p.lifestage) base.lifestage = p.lifestage;
    if (!base.type && p.type) base.type = p.type;
    if (!base.typeMethod && p.typeMethod) base.typeMethod = p.typeMethod;
    if (!base.adequacy && p.adequacy) base.adequacy = p.adequacy;
    if (!base.texture && p.texture) base.texture = p.texture;
    if (p.aafcoCertified) base.aafcoCertified = true;
    if (!base.otherCertifications.length && p.otherCertifications?.length) base.otherCertifications = p.otherCertifications;
    if (p.claims?.length) base.claims = mergeArrays(base.claims, p.claims);
    if (!base.intendedUse && p.intendedUse) base.intendedUse = p.intendedUse;
    if (p.ingredients?.length) base.ingredients = mergeArrays(base.ingredients, p.ingredients);
    if (p.additives?.length) base.additives = mergeArrays(base.additives ?? [], p.additives);
    if (p.guaranteedAnalysis) {
      const ga = p.guaranteedAnalysis;
      if (ga.protein != null && base.guaranteedAnalysis.protein == null) base.guaranteedAnalysis.protein = ga.protein;
      if (ga.fat != null && base.guaranteedAnalysis.fat == null) base.guaranteedAnalysis.fat = ga.fat;
      if (ga.fibre != null && base.guaranteedAnalysis.fibre == null) base.guaranteedAnalysis.fibre = ga.fibre;
      if (ga.ash != null && base.guaranteedAnalysis.ash == null) base.guaranteedAnalysis.ash = ga.ash;
      if (ga.moisture != null && base.guaranteedAnalysis.moisture == null) base.guaranteedAnalysis.moisture = ga.moisture;
      if (ga.others?.length && !base.guaranteedAnalysis.others.length) base.guaranteedAnalysis.others = ga.others;
    }
    if (base.taurineAdded == null && p.taurineAdded != null) base.taurineAdded = p.taurineAdded;
    if (base.weight == null && p.weight != null) base.weight = p.weight;
    if (base.price == null && p.price != null) base.price = p.price;
    if (!base.metEnergy100g && p.metEnergy100g) base.metEnergy100g = p.metEnergy100g;
    if (!base.manufacturerName && p.manufacturerName) base.manufacturerName = p.manufacturerName;
    if (!base.manufacturerContact && p.manufacturerContact) base.manufacturerContact = p.manufacturerContact;
    if (!base.countryOrigin && p.countryOrigin) base.countryOrigin = p.countryOrigin;
    if (!base.dateManufacture && p.dateManufacture) base.dateManufacture = p.dateManufacture;
    if (!base.dateExpiry && p.dateExpiry) base.dateExpiry = p.dateExpiry;
    if (p.translatedFlag) base.translatedFlag = true;
    if (p.confidence != null) base.confidence = Math.max(base.confidence ?? 0, p.confidence);
  }
  if (base.claims.length === 0 && partials.some((p) => p.claims?.length)) {
    base.claims = mergeArrays(...partials.map((p) => p.claims));
  }
  if (base.ingredients.length === 0 && partials.some((p) => p.ingredients?.length)) {
    base.ingredients = mergeArrays(...partials.map((p) => p.ingredients));
  }
  if (!base.additives?.length && partials.some((p) => p.additives?.length)) {
    base.additives = mergeArrays(...partials.map((p) => p.additives));
  }
  if (base.guaranteedAnalysis.others.length === 0 && partials.some((p) => p.guaranteedAnalysis?.others?.length)) {
    const collected: Array<{ label: string; value: string }> = [];
    for (const p of partials) {
      if (p.guaranteedAnalysis?.others?.length) {
        for (const o of p.guaranteedAnalysis.others) collected.push(o);
      }
    }
    base.guaranteedAnalysis.others = collected;
  }
  return base;
}

/**
 * Normalize n8n success response: [{ status: 'success', extracted_data: [ {...}, {...} ] }].
 * Returns merged ExtractedData or null if format doesn't match.
 */
export function normalizeN8nSuccessResponse(data: unknown): ExtractedData | null {
  if (!isN8nSuccessArray(data)) return null;
  const first = data[0];
  const arr = first.extracted_data;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const items = arr.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object');
  if (items.length === 0) return null;
  return mergeN8nItems(items);
}
