import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  LiveHealthResponse,
  ReadyHealthResponse,
} from './health.types.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) { }
  
  live(): LiveHealthResponse {
    return {
      status: 'ok',
      service: 'kitab-relay-api',
    };
  }

  async ready(): Promise<ReadyHealthResponse> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1 AS result');
      return {
        status: 'ok',
        service: 'kitab-relay-api',
        checks: { database: 'up' },
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'kitab-relay-api',
        checks: { database: 'down' },
      },{
        cause: error as Error,
      });
    }
  }
}
