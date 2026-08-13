import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TrpcModule } from './trpc/trpc.module.js';

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, TrpcModule],
})
export class AppModule {}
