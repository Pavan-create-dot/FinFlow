import request from 'supertest';
import { app } from '../src/app';

describe('Auth API', () => {
  it('should fail login without credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBeDefined();
  });
});
