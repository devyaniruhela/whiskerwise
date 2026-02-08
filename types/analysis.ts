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

/** Analyze webhook error: one or both images failed; error_code per image_id */
export interface AnalyzeImageError {
  image_id: string;
  error_code: string;
}

export interface AnalyzeErrorResponse {
  success?: false;
  image_errors: AnalyzeImageError[];
}

export interface AnalyzeSuccessResponse {
  success?: true;
  extract: Record<string, unknown>; // raw webhook extract (snake_case or camelCase)
}

/** Stored by food-input when fetch completes; loading page polls this key. */
export const ANALYZE_RESULT_PREFIX = 'ww_analyze_result_';

export interface StoredAnalyzeResult {
  ok: boolean;
  status?: number;
  data: Record<string, unknown>;
}
