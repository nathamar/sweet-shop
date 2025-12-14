import request from 'supertest';
import app from '../index';
import mongoose from 'mongoose';

// Ensure you mock DB or use a test DB in real scenario
describe('Sweet Shop API', () => {
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password', role: 'admin' });
    expect(res.statusCode).toEqual(201);
  });
  
  // Further tests for Login, CRUD, and Inventory...
});