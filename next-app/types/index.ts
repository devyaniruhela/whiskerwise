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
    others: Array<{ [key: string]: number }>;
  };
  taurineAdded: boolean | null;
  weight: number;
  price: number | null;
  priceCurrency: string;
  metEnergy100g: string | null;
  manufaturerName: string | null;
  manufacturerContact: string | null;
  countryOrigin: string | null;
  dateManufacture: string | null;
  dateExpiry: string | null;
  translatedFlag: boolean;
}

export interface StepData {
  label: string;
  detail: string;
  qcError?: string;
}
