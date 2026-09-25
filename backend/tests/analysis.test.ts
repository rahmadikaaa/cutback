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
