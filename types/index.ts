// Common types used across the application

export type QCState = 'empty' | 'uploading' | 'checking' | 'pass' | 'fail';

export type StepState = 'pending' | 'in-progress' | 'complete' | 'failed' | 'locked' | 'unlocking';

export interface CatProfile {
  id: string;
  name: string;
  avatar: string;
  ageYears: number;
  ageMonths: number;
  bodyCondition: string;
  healthConditions: string[];
  otherHealthDesc?: string;
  selected: boolean;
  /** Profile page: optional passport fields */
  weightKg?: number | null;
  dob?: string | null;
  neuteringStatus?: 'neutered' | 'not_neutered' | 'unknown' | null;
  outdoorAccess?: boolean | null;
  activityLevel?: 'lightly' | 'moderately' | 'very' | null;
}

export interface ProfileUser {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Country code for phone, e.g. +91. Default +91. */
  countryCode?: string;
}

export interface ScanHistoryItem {
  id: string;
  thumbnails: string[];
  reportRating?: string | null;
  brand?: string;
  variant?: string;
  scannedAt?: string;
}

export interface BodyCondition {
  id: string;
  label: string;
  desc: string;
  image: string;
}

export interface CatAvatar {
  id: string;
  image: string;
}

export interface ExtractedData {
  brand: string;
  variant: string;
  lifestage: string;
  type: string;
  typeMethod: string;
  adequacy: string;
  texture: string | null;
  aafcoCertified: boolean;
  otherCertifications: string[];
  claims: string[];
  intendedUse: string | null;
  ingredients: string[];
  additives: string[] | null;
  guaranteedAnalysis: {
    protein: number | null;
    fat: number | null;
    fibre: number | null;
    ash: number | null;
    moisture: number | null;
    /** Exact string values as sent; no numeric conversion or % formatting */
    others: Array<{ label: string; value: string }>;
  };
  taurineAdded: boolean | null;
  weight: number | null;
  price: number | null;
  priceCurrency: string;
  metEnergy100g: string | null;
  manufacturerName: string | null;
  manufacturerContact: string | null;
  countryOrigin: string | null;
  dateManufacture: string | null;
  dateExpiry: string | null;
  translatedFlag: boolean;
  /** Between 0-1; null if not provided */
  confidence?: number | null;
}

export interface StepData {
  label: string;
  detail: string;
  qcError?: string;
}
