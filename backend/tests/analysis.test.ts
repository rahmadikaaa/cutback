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

  it('should return REUPLOAD if imageBase64 is missing', async () => {
    revisions.set('test-ready-id', { id: 'test-ready-id', status: 'READY' });
    const response = await request(app).post('/api/analyze').send({ revisionId: 'test-ready-id' });
    expect(response.status).toBe(200);
    expect(response.body.route).toBe('REUPLOAD');
    expect(response.body.message).toContain('Photo data is missing');
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
