import request from 'supertest';
import app from '../src/app';

describe('Upload Endpoint (T2)', () => {
  it('should reject requests without a photo and return REUPLOAD', async () => {
    const response = await request(app).post('/api/upload');
    expect(response.status).toBe(400);
    expect(response.body.route).toBe('REUPLOAD');
  });

  it('should reject invalid file types with REUPLOAD', async () => {
    const invalidBuffer = Buffer.from('This is a simple text file, not an image.');
    const response = await request(app)
      .post('/api/upload')
      .attach('photo', invalidBuffer, 'test.txt');

    expect(response.status).toBe(200); // Handled by deterministic router
    expect(response.body.route).toBe('REUPLOAD');
    expect(response.body.message).toContain('Invalid file format');
  });

  it('should require consent (CONSENT_REQUIRED) for valid photos', async () => {
    // Generate dummy JPEG bytes: FF D8 FF
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
    
    const response = await request(app)
      .post('/api/upload')
      .attach('photo', jpegBuffer, 'test.jpg'); // no consent field attached

    expect(response.status).toBe(200);
    expect(response.body.route).toBe('CONSENT_REQUIRED');
  });

  it('should return READY_FOR_ANALYSIS with revision ID for valid photo with consent', async () => {
    // Generate dummy JPEG bytes: FF D8 FF
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01]);
    
    const response = await request(app)
      .post('/api/upload')
      .field('consent', 'true')
      .attach('photo', jpegBuffer, 'test.jpg');

    expect(response.status).toBe(200);
    expect(response.body.route).toBe('READY_FOR_ANALYSIS');
    expect(response.body.revisionId).toBeDefined();
  });
});
