/**
 * Client-side image validation for food label uploads.
 * Runs in the browser without hitting the server.
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_FILE_SIZE_MB = 15;

/** Allowed MIME types for upload (JPG, PNG, HEIC, WEBP). */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif', // some systems use heif for HEIC
  'image/webp',
] as const;

/** Allowed file extensions for display/validation. */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp'] as const;

export interface ClientValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file on the client: type and size only.
 * Returns immediately; does not hit the server.
 */
export function validateImageClient(file: File): ClientValidationResult {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No file selected.' };
  }

  const type = (file.type || '').toLowerCase();
  const isAllowedType =
    ALLOWED_MIME_TYPES.some((t) => type === t) ||
    ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isAllowedType) {
    return {
      valid: false,
      error: 'Please use JPG, PNG, HEIC, or WEBP. This format is not supported.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true };
}
