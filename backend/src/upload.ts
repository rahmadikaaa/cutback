import { Request, Response } from 'express';
import { genkit } from 'genkit';
import { z } from 'zod';
import crypto from 'crypto';
import { revisions } from './state';
import { saveRevision } from './firestoreDb';
import { uploadOriginalImage } from './cloudStorage';

const isImage = (buffer: Buffer): boolean => {
  if (buffer.length < 12) return false;
  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) return true;
  return false;
};

// Flow for handling uploads and returning deterministic routes
const ai = genkit({});

const uploadFlow = ai.defineFlow({
  name: 'uploadFlow',
  inputSchema: z.object({
    buffer: z.any(),
    size: z.number(),
    consent: z.boolean().default(false),
    mimeType: z.string().optional()
  }),
  outputSchema: z.object({
    route: z.enum(['REUPLOAD', 'CONSENT_REQUIRED', 'READY_FOR_ANALYSIS']),
    revisionId: z.string().optional(),
    message: z.string()
  })
}, async (input) => {
  // Deterministic validation
  if (input.size > 10_000_000) {
    return { route: 'REUPLOAD' as const, message: 'File exceeds 10MB limit' };
  }

  if (!input.buffer || !isImage(input.buffer as Buffer)) {
    return { route: 'REUPLOAD' as const, message: 'Invalid file format. Only JPEG, PNG, WebP allowed.' };
  }

  if (!input.consent) {
    return { route: 'CONSENT_REQUIRED' as const, message: 'Consent is required for AI processing' };
  }

  // Generate revision ID
  const revisionId = crypto.randomUUID();
  const buffer = input.buffer as Buffer;
  const mime = input.mimeType || 'image/jpeg';
  const base64Data = buffer.toString('base64');
  
  const state = {
    id: revisionId,
    status: 'READY' as const,
    imageBase64: `data:${mime};base64,${base64Data}`,
    originalImagePath: undefined as string | undefined
  };

  // Upload original image to Cloud Storage if enabled
  const storagePath = await uploadOriginalImage(revisionId, buffer, mime);
  if (storagePath) {
    state.originalImagePath = storagePath;
  }

  revisions.set(revisionId, state);

  // Persist the structured data to Firestore, silently skipping if not configured
  // The saveRevision abstraction intentionally strips out imageBase64 and other large/transient objects
  await saveRevision(revisionId, state);

  return { 
    route: 'READY_FOR_ANALYSIS' as const, 
    revisionId,
    message: 'Photo is valid and consent granted.' 
  };
});

export const uploadHandler = async (req: Request, res: Response) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();

  try {
    const file = req.file;
    const consent = req.body?.consent === 'true' || req.body?.consent === true;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        route: 'REUPLOAD',
        message: 'No photo provided'
      });
    }

    const result = await uploadFlow({
      buffer: file.buffer,
      size: file.size,
      consent,
      mimeType: file.mimetype
    });

    res.json({
      status: 'success',
      requestId: reqId,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      requestId: reqId,
      message: error.message || 'Internal server error'
    });
  }
};
