import request from 'supertest';
import app from '../src/app';

describe('Firestore Diagnostic Health Endpoint', () => {
  it('should return service status and firestore connection info without exposing secrets', async () => {
    const res = await request(app).get('/health/firestore');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('service', 'cutback-backend');
    expect(res.body).toHaveProperty('firestore');
    expect(res.body.firestore).toHaveProperty('enabled');
    expect(res.body.firestore).toHaveProperty('connected');
    expect(res.body.firestore).toHaveProperty('message');
    // Ensure no sensitive fields are leaked
    expect(res.body).not.toHaveProperty('apiKey');
    expect(res.body).not.toHaveProperty('privateKey');
    expect(res.body).not.toHaveProperty('credentials');
  });
});
