import request from 'supertest';
import app from '../../src/server';

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@kairoz.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data.accessToken');
    expect(res.body).toHaveProperty('data.refreshToken');
    expect(res.body.data.user.email).toBe('admin@kairoz.com');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@kairoz.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@kairoz.com' });

    expect(res.status).toBe(400);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@kairoz.com', password: 'Admin@123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@kairoz.com', password: 'Admin@123' });
    token = res.body.data.accessToken;
  });

  it('returns user profile for valid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@kairoz.com');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
