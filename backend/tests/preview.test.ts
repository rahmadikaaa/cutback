import request from 'supertest';
import app from '../src/app';
import { revisions } from '../src/state';

describe('Preview Endpoint (T5)', () => {
  beforeEach(() => {
    revisions.clear();
  });

  describe('POST /api/preview', () => {
    it('should return STALE if revisionId is missing', async () => {
      const response = await request(app).post('/api/preview').send({ hairstyleId: 'style1' });
      expect(response.status).toBe(400);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if revision does not exist', async () => {
      const response = await request(app).post('/api/preview').send({ revisionId: 'fake', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if state is not READY_FOR_PREVIEW', async () => {
      revisions.set('test-preview', { 
        id: 'test-preview', 
        status: 'ANALYZED',
        selectedHairstyleId: 'style1' 
      });
      const response = await request(app).post('/api/preview').send({ revisionId: 'test-preview', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if selectedHairstyleId does not match', async () => {
      revisions.set('test-preview', { 
        id: 'test-preview', 
        status: 'READY_FOR_PREVIEW',
        selectedHairstyleId: 'style2' 
      });
      const response = await request(app).post('/api/preview').send({ revisionId: 'test-preview', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
    });

    it('should return SUCCESS without re-generating if preview is already PENDING', async () => {
      revisions.set('test-preview', { 
        id: 'test-preview', 
        status: 'READY_FOR_PREVIEW',
        selectedHairstyleId: 'style1',
        previewState: 'PENDING'
      });
      const response = await request(app).post('/api/preview').send({ revisionId: 'test-preview', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('SUCCESS');
      expect(response.body.message).toContain('already in progress');
    });

    it('should return SUCCESS without re-generating if preview is SUCCESS', async () => {
      revisions.set('test-preview', { 
        id: 'test-preview', 
        status: 'READY_FOR_PREVIEW',
        selectedHairstyleId: 'style1',
        previewState: 'SUCCESS',
        previewImageUrl: 'http://fake.url'
      });
      const response = await request(app).post('/api/preview').send({ revisionId: 'test-preview', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('SUCCESS');
      expect(response.body.previewImageUrl).toBe('http://fake.url');
    });
  });
});
