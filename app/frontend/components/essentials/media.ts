/** One rule for every catalogue product photo (D, 19 Jul 2026).
 *
 *  All 52 images in the catalogue were measured: 83% are square-ish (0.91-1.25,
 *  30 of them exactly 1:1), 7 are landscape (up to 1.80) and 2 are portrait
 *  (0.60). They used to be poured into a 1.24 landscape box with `cover`, which
 *  threw away 52% of the tall Matisse bag - it rendered as a cat's face with the
 *  brand name cropped off entirely.
 *
 *  So: a SQUARE box (matching the 83%) and `contain` (so nothing is ever cropped).
 *  For the square majority the two fits are indistinguishable; contain only
 *  differs on the handful of odd-shaped photos, and there it is the difference
 *  between a readable product and an unidentifiable crop.
 *
 *  Ground is `paper` rather than the old `sel/40` tint: these are cut-out PNGs on
 *  white, so a warm tint showed a hard white rectangle floating inside the card.
 *  #FFFDFB sits flush against them while staying in the palette. */
export const MEDIA_BOX = 'relative aspect-square overflow-hidden rounded-md bg-paper';

/** Inset so a contained product never touches the very edge of its box. */
export const MEDIA_PAD = 'p-2.5';

/** Product photos are shown whole, never cropped. */
export const MEDIA_FIT = 'object-contain';
