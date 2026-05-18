import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.db.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { status: 'error', database: 'down' };
    }
  }
}
