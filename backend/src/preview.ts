import { Request, Response } from 'express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { revisions } from './state';
import crypto from 'crypto';

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

export const previewFlow = ai.defineFlow({
  name: 'previewFlow',
  inputSchema: z.object({
    revisionId: z.string(),
    hairstyleId: z.string()
  }),
  outputSchema: z.object({
    route: z.enum(['SUCCESS', 'STALE', 'RETRY_REQUIRED', 'FAILED']),
    message: z.string(),
    previewImageUrl: z.string().optional()
  })
}, async (input) => {
  const state = revisions.get(input.revisionId);
  
  if (!state) {
    return { route: 'STALE' as const, message: 'Revision not found.' };
  }

  // T5.6: If the user changes hairstyle while preview is pending, old result must not overwrite
  // Or if selectedHairstyleId doesn't match input, it's stale
  if (state.selectedHairstyleId !== input.hairstyleId) {
    return { route: 'STALE' as const, message: 'Hairstyle selection changed.' };
  }

  if (state.status !== 'READY_FOR_PREVIEW') {
    return { route: 'STALE' as const, message: `Cannot generate preview in state: ${state.status}` };
  }

  // Double click / duplicate request check (T5.6)
  if (state.previewState === 'PENDING') {
    return { route: 'SUCCESS' as const, message: 'Preview generation already in progress.' };
  }
  
  if (state.previewState === 'SUCCESS' && state.previewImageUrl) {
    // T5.8: Persistence in current flow (Do not regenerate merely because the user returns)
    return { route: 'SUCCESS' as const, message: 'Preview already generated.', previewImageUrl: state.previewImageUrl };
  }

  const selectedHairstyle = state.recommendations?.find(r => r.id === input.hairstyleId);
  if (!selectedHairstyle) {
    return { route: 'STALE' as const, message: 'Selected hairstyle not found.' };
  }

  state.previewState = 'PENDING';

  try {
    // T5.4: Instruct generation to preserve identity, skin tone, pose, framing, background
    const prompt = `A photo of a person. Preserve face identity, skin tone, pose, framing, and background EXACTLY. Change ONLY the hairstyle to match: ${selectedHairstyle.name} - ${selectedHairstyle.description}. The hair should seamlessly match the person's face shape (${state.analysis?.attributes?.faceShape || 'unknown'}) and hair type (${state.analysis?.attributes?.hairType || 'unknown'}).`;

    // Try to pass the original image for image-to-image/inpainting editing if Imagen supports it
    // If not, at least we pass it in the prompt array
    const { media } = await ai.generate({
      model: 'googleai/gemini-3.1-flash-image',
      prompt: [
        { text: prompt },
        { media: { url: state.imageBase64! } }
      ],
      output: { format: 'media' }
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to return media.');
    }

    // T5.6: Re-check if selection changed during generation
    if (state.selectedHairstyleId !== input.hairstyleId) {
      return { route: 'STALE' as const, message: 'Hairstyle selection changed during generation. Result discarded.' };
    }

    state.previewState = 'SUCCESS';
    // Ensure the generated image has a Data URI prefix for the frontend
    let finalUrl = media.url;
    if (!finalUrl.startsWith('data:')) {
      finalUrl = `data:image/jpeg;base64,${finalUrl}`;
    }
    state.previewImageUrl = finalUrl;
    
    return { route: 'SUCCESS' as const, message: 'Preview generated successfully.', previewImageUrl: state.previewImageUrl };
  } catch (err: any) {
    console.error('Preview error:', err);
    state.previewState = 'FAILED';
    state.error = err.message || 'Image generation failed.';
    return { route: 'FAILED' as const, message: state.error || 'Preview failed' };
  }
});

export const previewHandler = async (req: Request, res: Response) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  const { revisionId, hairstyleId } = req.body;

  if (!revisionId || !hairstyleId) {
    return res.status(400).json({ status: 'error', route: 'STALE', message: 'revisionId and hairstyleId are required' });
  }

  try {
    const start = Date.now();
    console.log(`[preview_requested] Request: ${reqId}, Revision: ${revisionId}, Style: ${hairstyleId}`);
    
    const result = await previewFlow({ revisionId, hairstyleId });
    
    const latencyMs = Date.now() - start;
    
    if (result.route === 'SUCCESS' && result.previewImageUrl) {
      console.log(`[preview_completed] Request: ${reqId}, Revision: ${revisionId}, Model: googleai/gemini-3.1-flash-image, Latency: ${latencyMs}ms`);
    } else if (result.route === 'FAILED') {
      console.log(`[preview_failed] Request: ${reqId}, Revision: ${revisionId}, Latency: ${latencyMs}ms, Error: ${result.message}`);
    }

    res.json({
      status: 'success',
      requestId: reqId,
      ...result
    });
  } catch (err: any) {
    console.error(`[preview_failed] Request: ${reqId}, Error: ${err.message}`);
    res.status(500).json({
      status: 'error',
      requestId: reqId,
      message: err.message || 'Internal server error'
    });
  }
};
