import request from 'supertest';
import app from '../src/app';

describe('Smoke Test Endpoint (BF-07)', () => {
  const originalKey = process.env.GEMINI_API_KEY;

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should return 503 if credentials are missing (Negative path test)', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await request(app).post('/diagnostic/smoke');
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('PROVIDER_CREDENTIALS_MISSING');
  });
});
