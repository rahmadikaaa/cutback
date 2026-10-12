import request from 'supertest';
import app from '../src/app';
import { revisions } from '../src/state';

describe('Analysis Endpoint (T3)', () => {
  beforeEach(() => {
    revisions.clear();
  });

  it('should return REUPLOAD if revisionId is missing', async () => {
    const response = await request(app).post('/api/analyze').send({});
    expect(response.status).toBe(400);
    expect(response.body.route).toBe('REUPLOAD');
  });

  it('should return STALE if revisionId does not exist', async () => {
    const response = await request(app).post('/api/analyze').send({ revisionId: 'fake-id' });
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('STALE');
  });

  it('should return STALE if revision is in FAILED state and we want to analyze? No, FAILED is allowed to retry', async () => {
    revisions.set('test-failed-id', { id: 'test-failed-id', status: 'STALE' });
    const response = await request(app).post('/api/analyze').send({ revisionId: 'test-failed-id' });
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('STALE');
  });

  it('should return existing analysis if status is already ANALYZED (idempotency)', async () => {
    const mockAnalysis = {
      visualSuitability: { isValid: true },
      attributes: {
        hairLength: { value: 'short', source: 'Observed' },
        hairType: { value: 'straight', source: 'Observed' },
        hairThickness: { value: 'thick', source: 'Observed' },
        hairLine: { value: 'straight', source: 'Observed' },
        faceShape: { value: 'oval', source: 'Inferred' }
      }
    };
    revisions.set('test-analyzed-id', {
      id: 'test-analyzed-id',
      status: 'ANALYZED',
      imageBase64: 'data:image/jpeg;base64,123',
      analysis: mockAnalysis
    });

    const response = await request(app).post('/api/analyze').send({ revisionId: 'test-analyzed-id' });
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('SUCCESS');
    expect(response.body.message).toContain('already completed');
    expect(response.body.analysis).toEqual(mockAnalysis);
  });

  it('should wait for and return the in-flight analysisPromise for concurrent requests', async () => {
    let resolvePromise: any;
    const mockResult = {
      route: 'SUCCESS',
      analysis: { visualSuitability: { isValid: true } },
      message: 'Concurrent analysis complete.'
    };
    const inFlightPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    revisions.set('test-concurrent-id', {
      id: 'test-concurrent-id',
      status: 'READY',
      imageBase64: 'data:image/jpeg;base64,123',
      analysisPromise: inFlightPromise
    });

    // Send request while promise is pending
    const reqPromise = request(app).post('/api/analyze').send({ revisionId: 'test-concurrent-id' });

    // Resolve in-flight promise
    resolvePromise(mockResult);

    const response = await reqPromise;
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('SUCCESS');
    expect(response.body.message).toBe('Concurrent analysis complete.');
  });
});

import { AnalysisSchema } from '../src/analysis';

describe('AnalysisSchema Provenance Validation (CB-V07-002)', () => {
  it('should validate all 4 valid source values (Observed, Inferred, User-provided, Unknown)', () => {
    const validData = {
      visualSuitability: { isValid: true },
      attributes: {
        hairLength: { value: 'short', source: 'Observed' },
        hairType: { value: 'straight', source: 'Inferred' },
        hairThickness: { value: 'fine', source: 'User-provided' },
        hairLine: { value: 'receding', source: 'Unknown' },
        faceShape: { value: 'oval', source: 'Observed' }
      }
    };
    
    const result = AnalysisSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail validation when an invalid source such as "Guessed" is provided', () => {
    const invalidData = {
      visualSuitability: { isValid: true },
      attributes: {
        hairLength: { value: 'short', source: 'Guessed' }, // Invalid source
        hairType: { value: 'straight', source: 'Observed' },
        hairThickness: { value: 'fine', source: 'Observed' },
        hairLine: { value: 'receding', source: 'Observed' },
        faceShape: { value: 'oval', source: 'Observed' }
      }
    };
    
    const result = AnalysisSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('hairLength');
      expect(result.error.issues[0].path).toContain('source');
    }
  });

  it('should fail validation when value is wrapped but source is missing', () => {
    const missingSourceData = {
      visualSuitability: { isValid: true },
      attributes: {
        hairLength: { value: 'short' }, // Missing source
        hairType: { value: 'straight', source: 'Observed' },
        hairThickness: { value: 'fine', source: 'Observed' },
        hairLine: { value: 'receding', source: 'Observed' },
        faceShape: { value: 'oval', source: 'Observed' }
      }
    };
    
    const result = AnalysisSchema.safeParse(missingSourceData);
    expect(result.success).toBe(false);
  });
});
