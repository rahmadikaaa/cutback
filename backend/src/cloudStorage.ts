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
