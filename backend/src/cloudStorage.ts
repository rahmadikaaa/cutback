import { getStorage, isCloudEnabled } from './firebase';

export async function uploadOriginalImage(revisionId: string, buffer: Buffer, mimeType: string): Promise<string | null> {
  if (!isCloudEnabled()) return null;

  const storage = getStorage();
  if (!storage) return null;

  try {
    const bucket = storage.bucket();
    const extension = mimeType.split('/')[1] || 'jpg';
    const filePath = `revisions/${revisionId}/original.${extension}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
    });

    console.log(`[cloudStorage] Uploaded original image for revision ${revisionId} to ${filePath}`);
    return filePath;
  } catch (err: any) {
    console.error(`[cloudStorage] Failed to upload original image for revision ${revisionId}: ${err.message}`);
    return null;
  }
}

export async function uploadPreviewImage(
  revisionId: string,
  imagePayload: string | Buffer,
  mimeType = 'image/jpeg'
): Promise<string | null> {
  if (!isCloudEnabled()) return null;

  const storage = getStorage();
  if (!storage) return null;

  try {
    let buffer: Buffer;
    let contentType = mimeType;

    if (Buffer.isBuffer(imagePayload)) {
      buffer = imagePayload;
    } else if (typeof imagePayload === 'string') {
      const match = imagePayload.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contentType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(imagePayload, 'base64');
      }
    } else {
      return null;
    }

    const bucket = storage.bucket();
    const filePath = `revisions/${revisionId}/preview.jpg`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    console.log(`[cloudStorage] Uploaded preview image for revision ${revisionId} to ${filePath}`);
    return filePath;
  } catch (err: any) {
    console.error(`[cloudStorage] Failed to upload preview image for revision ${revisionId}: ${err.message}`);
    return null;
  }
}
