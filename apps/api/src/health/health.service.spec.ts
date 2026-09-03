import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports liveness without querying the database', () => {
    const query = vi.fn();
    const service = new HealthService({
      $queryRawUnsafe: query,
    } as unknown as PrismaService);

    expect(service.live()).toEqual({
      status: 'ok',
      service: 'kitab-relay-api',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports readiness after a successful database probe', async () => {
    const service = new HealthService({
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService);

    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      service: 'kitab-relay-api',
      checks: { database: 'up' },
    });
  });

  it('returns a service-unavailable error when the database probe fails', async () => {
    const service = new HealthService({
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('offline')),
    } as unknown as PrismaService);

    await expect(service.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});