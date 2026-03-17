import request from 'supertest';
import app from '../index';

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health').expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('services');
  });

  it('should return API info for /api/v1', async () => {
    const response = await request(app).get('/api/v1').expect(200).expect('Content-Type', /json/);

    expect(response.body).toEqual({
      message: 'Learnify Backend API v1',
      version: '1.0.0',
    });
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
  });
});
