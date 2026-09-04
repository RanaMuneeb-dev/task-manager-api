const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Task Authorization & Security Test Cases', () => {
  beforeAll(async () => {
    // Atlas DB URI ya local URI se connect karein
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 15000); // 15 seconds connection timeout

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('Should return 401 Unauthorized if no token is passed', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('Should return 403 Forbidden when User A tries to access User B task ID', async () => {
    const fakeUserAToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sU-403-fake-token';
    const userBTaskId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/tasks/${userBTaskId}`)
      .set('Authorization', `Bearer ${fakeUserAToken}`);

    expect([401, 403]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });
});