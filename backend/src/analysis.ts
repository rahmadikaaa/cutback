import { Request, Response } from 'express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { revisions } from './state';
import { saveRevision } from './firestoreDb';
import crypto from 'crypto';

// T3.1: Analysis Schema
export const AnalysisSchema = z.object({
  visualSuitability: z.object({
    isValid: z.boolean(),
    reason: z.string().optional()
  }),
  attributes: z.object({
    hairLength: z.enum(['short', 'medium', 'long', 'unknown']),
    hairType: z.enum(['straight', 'wavy', 'curly', 'coily', 'unknown']),
    hairThickness: z.enum(['fine', 'medium', 'thick', 'unknown']),
    hairLine: z.enum(['receding', 'widow_peak', 'straight', 'unknown']),
    faceShape: z.enum(['oval', 'round', 'square', 'heart', 'diamond', 'oblong', 'unknown']),
  }).optional()
});

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

export const analysisFlow = ai.defineFlow({
  name: 'analysisFlow',
  inputSchema: z.object({
    revisionId: z.string(),
  }),
  outputSchema: z.object({
    route: z.enum(['SUCCESS', 'REUPLOAD', 'RETRY_REQUIRED', 'STALE']),
    analysis: AnalysisSchema.optional(),
    message: z.string()
  })
}, async (input) => {
  const state = revisions.get(input.revisionId);
  
  if (!state) {
    return { route: 'STALE' as const, message: 'Revision not found or stale.' };
  }
  
  if (state.status !== 'READY' && state.status !== 'FAILED') {
    return { route: 'STALE' as const, message: `Cannot analyze photo in state: ${state.status}` };
  }

  if (!state.imageBase64) {
    return { route: 'REUPLOAD' as const, message: 'Photo data is missing.' };
  }

  // T3.12: Reasoning node
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-3.5-flash',
      prompt: `Analyze this photo for hairstyle recommendations.
      
      CRITICAL INSTRUCTIONS:
      1. Strictly adhere to the requested JSON schema.
      2. DO NOT infer or mention identity, ethnicity, personality, or health status.
      3. First check visual suitability: is there exactly one person, with face and hair sufficiently visible? If not, set isValid to false and provide a reason.
      4. If visually suitable, set isValid to true and provide the hair attributes.
      5. If any attribute is obscured or uncertain, explicitly use "unknown".`,
      messages: [
        {
          role: 'user',
          content: [
            { media: { url: state.imageBase64 } },
            { text: 'Analyze this photo according to the instructions.' }
          ]
        }
      ],
      output: {
        schema: AnalysisSchema
      }
    });

    // T3.13: Deterministic schema validation immediately after reasoning node
    // Genkit's `generate` with output schema already validates and throws if it fails.
    // We get typed output here.
    const analysis = output;

    if (!analysis) {
        throw new Error('Model returned empty output');
    }

    if (!analysis.visualSuitability.isValid) {
      state.status = 'FAILED';
      state.error = analysis.visualSuitability.reason || 'Visually inadequate photo.';
      await saveRevision(input.revisionId, state);
      return { route: 'REUPLOAD' as const, message: state.error || 'Visually inadequate photo.' };
    }

    // T3.7: Bind result to photo/revision ID
    state.status = 'ANALYZED';
    state.analysis = analysis;
    await saveRevision(input.revisionId, state);

    return { route: 'SUCCESS' as const, analysis, message: 'Analysis complete.' };
  } catch (err: any) {
    console.error('Analysis error:', err);
    // T3.6: Reject invalid AI output with clear retry state
    // T3.14: Route schema failure/retry through deterministic state
    state.status = 'FAILED';
    state.error = err.message || 'Analysis failed or schema validation failed.';
    await saveRevision(input.revisionId, state);
    return { route: 'RETRY_REQUIRED' as const, message: state.error || 'Analysis failed' };
  }
});

export const analysisHandler = async (req: Request, res: Response) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  const { revisionId } = req.body;

  if (!revisionId) {
    return res.status(400).json({ status: 'error', route: 'REUPLOAD', message: 'revisionId is required' });
  }

  try {
    const start = Date.now();
    const result = await analysisFlow({ revisionId });
    const latencyMs = Date.now() - start;

    // T3.15: Record latency
    console.log(`[analysis_completed] Request: ${reqId}, Revision: ${revisionId}, Route: ${result.route}, Latency: ${latencyMs}ms`);

    res.json({
      status: 'success',
      requestId: reqId,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      requestId: reqId,
      message: err.message || 'Internal server error'
    });
  }
};
