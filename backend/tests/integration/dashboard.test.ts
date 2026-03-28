import request from 'supertest';
import app from '../../src/server';

let token: string;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@kairoz.com', password: 'Admin@123' });
  token = res.body.data.accessToken;
});

describe('GET /api/v1/dashboard/kpis', () => {
  it('returns KPI data with expected shape', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/kpis')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalLabs: expect.any(Number),
      activeCertifications: expect.any(Number),
      openCapas: expect.any(Number),
      pendingRequests: expect.any(Number),
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/dashboard/kpis');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/dashboard/trends', () => {
  it('returns an array of trend entries', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/v1/dashboard/upcoming', () => {
  it('returns upcoming events', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/upcoming')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('certifications');
    expect(res.body.data).toHaveProperty('capas');
    expect(res.body.data).toHaveProperty('audits');
  });
});
