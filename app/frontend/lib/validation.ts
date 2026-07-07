/**
 * Validation helpers for profile and forms.
 */

/** Allow only letters, spaces, hyphens, apostrophes (no numbers or special chars) */
const NAME_REGEX = /^[a-zA-Z\s\-']*$/;

export function isValidName(value: string): boolean {
  return NAME_REGEX.test(value);
}

export function filterNameInput(value: string): string {
  return value.replace(/[^a-zA-Z\s\-']/g, '');
}

const PHONE_DIGITS_ONLY = /\d/g;

/** Phone number part must be exactly 10 digits when provided. */
export function isValidPhone(value: string): boolean {
  if (!value.trim()) return true; // optional
  const digits = (value.trim().match(PHONE_DIGITS_ONLY) || []).join('');
  return digits.length === 10;
}

/** Keep only digits (for phone number field). */
export function filterPhoneDigits(value: string, maxLength = 10): string {
  const digits = (value.replace(/\D/g, '')).slice(0, maxLength);
  return digits;
}

/** Standard email */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true; // optional
  return EMAIL_REGEX.test(value.trim());
}

/** DOB: not in future, not more than 25 years ago from today */
export function isValidDOB(dateStr: string | null | undefined): boolean {
  if (!dateStr?.trim()) return true; // optional
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (d > today) return false; // future
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 25);
  minDate.setHours(0, 0, 0, 0);
  return d >= minDate;
}

export function getDOBMaxDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDOBMinDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d.toISOString().slice(0, 10);
}
