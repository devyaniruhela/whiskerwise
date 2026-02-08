export const QC_ERROR_MESSAGES: Record<string, string> = {
  // Download errors
  download_failed:
    "Oops! We encountered an issue. Please re-upload and try again.",

  // QC errors
  unsupported_format:
    "File format not supported. Please upload a valid image file.",
  unclear:
    "Image is blurry or out of focus. Hold your camera steady and try again.",
  lighting_issue:
    "Image has too much glare or is too dark. Check your lighting and retake the photo.",
  low_resolution:
    "Image quality is too low. Make sure the file is at least 0.5MB and text is readable.",
  not_cat_food:
    "This doesn't appear to be cat food packaging. Please upload a cat food label.",

  // System errors
  parse_error:
    "We couldn't process this image. Please reupload & try again?",
  unknown_error: "Something went wrong. Please try again?",
  invalid_image_categories:
    "Please make sure you upload one front and one back label.",
  missing_image_category:
    "Expected exactly one photo of the front and back panel. Please check & upload again.",
};

export function getErrorMessage(errorCode: string): string {
  return QC_ERROR_MESSAGES[errorCode] ?? QC_ERROR_MESSAGES.unknown_error;
}
