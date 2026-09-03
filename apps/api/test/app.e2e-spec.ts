import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('health endpoints', () => {
  let app: INestApplication;
  const query = vi.fn();

  beforeEach(async () => {
    query.mockReset();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRawUnsafe: query })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health/live does not require PostgreSQL', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect({ status: 'ok', service: 'kitab-relay-api' });
    expect(query).not.toHaveBeenCalled();
  });

  it('GET /api/v1/health/ready reports a healthy database', async () => {
    query.mockResolvedValue([{ result: 1 }]);
    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'kitab-relay-api',
        checks: { database: 'up' },
      });
  });

  it('GET /api/v1/health/ready returns 503 when PostgreSQL is unavailable', async () => {
    query.mockRejectedValue(new Error('offline'));
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);
    expect(response.body.checks).toEqual({ database: 'down' });
  });
});