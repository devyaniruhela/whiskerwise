/**
 * Cloudinary direct upload with UUID as public_id.
 * Folder is configured in the upload preset.
 * Requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in env.
 */

function getCloudinaryUploadUrl(): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloudName) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Add it to your .env.local.');
  }
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}

export interface CloudinaryUploadResult {
  imageId: string;
  cloudinaryUrl: string;
  assetId: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
}

/**
 * Upload a QC-passed image to Cloudinary. Generates imageId (UUID) and uses it as public_id.
 */
export async function uploadImageToCloudinary(
  file: File,
  category: 'front' | 'back'
): Promise<CloudinaryUploadResult> {
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  if (!uploadPreset) {
    throw new Error('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not set. Add it to your .env.local.');
  }

  const imageId = crypto.randomUUID();
  const uploadUrl = getCloudinaryUploadUrl();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', imageId);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
  };

  return {
    imageId,
    cloudinaryUrl: data.secure_url,
    assetId: data.public_id,
    width: data.width ?? 0,
    height: data.height ?? 0,
    sizeBytes: data.bytes ?? file.size,
    format: data.format ?? '',
  };
}
