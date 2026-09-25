import request from 'supertest';
import app from '../src/app';
import { revisions } from '../src/state';

describe('Recommendation Endpoint (T4)', () => {
  beforeEach(() => {
    revisions.clear();
  });

  describe('POST /api/recommendations', () => {
    it('should return STALE if revisionId is missing', async () => {
      const response = await request(app).post('/api/recommendations').send({});
      expect(response.status).toBe(400);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if revision does not exist', async () => {
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'fake-id' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if state is not ANALYZED/RECOMMENDATIONS_READY', async () => {
      revisions.set('test-ready-id', { id: 'test-ready-id', status: 'READY' });
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'test-ready-id' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
      expect(response.body.message).toContain('Cannot generate recommendations in state: READY');
    });

    it('should return STALE if analysis is missing despite being in ANALYZED state', async () => {
      revisions.set('test-analyzed', { id: 'test-analyzed', status: 'ANALYZED' });
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'test-analyzed' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
      expect(response.body.message).toBe('Missing analysis.');
    });
  });

  describe('POST /api/select', () => {
    it('should return 400 error if revision is not found or has no recommendations', async () => {
      revisions.set('test-analyzed', { id: 'test-analyzed', status: 'ANALYZED' });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-analyzed', hairstyleId: 'style1' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid state for selection.');
    });

    it('should return 404 if hairstyleId is not in recommendations', async () => {
      revisions.set('test-recs', { 
        id: 'test-recs', 
        status: 'RECOMMENDATIONS_READY',
        recommendations: [{ id: 'style1', name: 'Buzz' }]
      });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-recs', hairstyleId: 'invalid' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hairstyle not found in recommendations.');
    });

    it('should successfully select style and update state to READY_FOR_PREVIEW', async () => {
      revisions.set('test-recs', { 
        id: 'test-recs', 
        status: 'RECOMMENDATIONS_READY',
        recommendations: [{ id: 'style1', name: 'Buzz' }]
      });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-recs', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('READY_FOR_PREVIEW');
      expect(response.body.selectedHairstyleId).toBe('style1');
      
      const state = revisions.get('test-recs');
      expect(state?.status).toBe('READY_FOR_PREVIEW');
      expect(state?.selectedHairstyleId).toBe('style1');
    });
  });
});
