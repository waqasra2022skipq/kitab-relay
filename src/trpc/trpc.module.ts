import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service.js';
import { TrpcController } from './trpc.controller.js';
import { AppRouterService } from './routers/app.router.js';
import { AuthRouter } from './routers/auth.router.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  providers: [TrpcService, AppRouterService, AuthRouter],
  controllers: [TrpcController],
})
export class TrpcModule {}
