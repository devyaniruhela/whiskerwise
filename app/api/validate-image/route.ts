import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);

export interface ValidateImageResponse {
  valid: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidateImageResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get('image') ?? formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { valid: false, error: 'No image file provided.' },
        { status: 400 }
      );
    }

    const blob = file as Blob;
    const contentType = (blob.type || '').toLowerCase();
    const size = blob.size;

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Unsupported format. Use JPG, PNG, HEIC, or WEBP.',
        },
        { status: 400 }
      );
    }

    if (size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          valid: false,
          error: 'File is too large. Maximum size is 15MB.',
        },
        { status: 400 }
      );
    }

    if (size === 0) {
      return NextResponse.json(
        { valid: false, error: 'File is empty.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await blob.arrayBuffer());

    const metadata = await sharp(buffer)
      .metadata()
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(message);
      });

    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (!width || !height) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Could not read image dimensions. The file may be corrupted or unsupported.',
        },
        { status: 400 }
      );
    }

    const sessionId = request.headers.get('X-Session-Id')?.trim() || null;
    if (process.env.NODE_ENV === 'development' && sessionId) {
      console.log('[validate-image] OK', { width, height, sessionId });
    }
    return NextResponse.json({
      valid: true,
      dimensions: { width, height },
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[validate-image] Error:', err);
    }
    const message = err instanceof Error ? err.message : 'Image validation failed.';
    const isSharpError =
      message.includes('Input') ||
      message.includes('decode') ||
      message.includes('corrupt') ||
      message.includes('unsupported');

    return NextResponse.json(
      {
        valid: false,
        error: isSharpError
          ? 'Image could not be read. It may be corrupted or in an unsupported format.'
          : 'Something went wrong. Please try another image.',
      },
      { status: 400 }
    );
  }
}
