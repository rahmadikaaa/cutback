import { Request, Response } from 'express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import crypto from 'crypto';

export const smokeTestHandler = async (req: Request, res: Response) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      status: 'error',
      code: 'PROVIDER_CREDENTIALS_MISSING',
      message: 'Smoke test requires AI credentials.'
    });
  }

  try {
    const ai = genkit({
      plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
    });
    
    // T1 graph validation: deterministic -> reasoning -> deterministic validation
    const smokeFlow = ai.defineFlow({
      name: 'smokeTestFlow',
      inputSchema: z.string(),
      outputSchema: z.string(),
    }, async (input: string) => {
      // 1. Deterministic function: check input
      if (input !== 'OK') {
        throw new Error('Input must be OK');
      }

      // 2. Reasoning node
      const { text } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: 'Respond with a single word: OK',
      });
      
      // 3. Deterministic validation
      if (!text || !text.includes('OK')) {
        throw new Error('Model did not return OK');
      }
      
      return text.trim();
    });

    const startTime = Date.now();
    const result = await smokeFlow('OK');
    const latency = Date.now() - startTime;

    res.json({
      status: 'success',
      requestId: reqId,
      stage: 'smoke_test',
      model: 'gemini-2.5-flash',
      latencyMs: latency,
      result: result
    });
  } catch (error: any) {
    res.status(502).json({
      status: 'error',
      requestId: reqId,
      code: 'PROVIDER_ERROR',
      message: error.message
    });
  }
};
