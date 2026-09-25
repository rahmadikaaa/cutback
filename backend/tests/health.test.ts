import request from 'supertest';
import app from '../src/app';

describe('Health Endpoint (BF-02)', () => {
  it('should return 200 OK and service status without AI quota', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('cutback-backend');
  });
});
