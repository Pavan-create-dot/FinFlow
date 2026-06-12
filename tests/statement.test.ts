import request from 'supertest';
import { app } from '../src/app';

describe('Statement API', () => {
  it('should require authentication for POST /statements/upload', async () => {
    const res = await request(app).post('/api/v1/statements/upload');
    expect(res.status).toBe(401);
  });
});
