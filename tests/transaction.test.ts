import request from 'supertest';
import { app } from '../src/app';

describe('Transaction API', () => {
  it('should require authentication for GET /transactions', async () => {
    const res = await request(app).get('/api/v1/transactions');
    expect(res.status).toBe(401); // Assuming 401 Unauthorized
  });
});
