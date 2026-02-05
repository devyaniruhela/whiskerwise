/**
 * Types for the analysis flow: upload metadata and payload sent to n8n when user clicks Analyze.
 */

export interface ImageData {
  imageId: string;
  cloudinaryUrl: string;
  category: 'front' | 'back';
}

export type CTASourceAnalysis = 'landing_main' | 'landing_personalise' | 'profile';

export interface AnalysisPayload {
  analysis_id: string;
  session_id: string;
  personalise_flag: boolean;
  cat_ids: string[];
  images: ImageData[];
  cta_source: CTASourceAnalysis;
  timestamp: string; // ISO
}

/** Stored in localStorage until user clicks Analyze */
export interface StoredAnalysisImage {
  imageId: string;
  cloudinaryUrl: string;
  category: 'front' | 'back';
  uploadedAt: string; // ISO
  qcPassed: true;
}

export const ANALYSIS_IMAGES_STORAGE_KEY = 'ww_analysis_images';
