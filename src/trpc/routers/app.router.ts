import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc.service.js';
import { AuthRouter } from './auth.router.js';

export type AppRouter = InstanceType<typeof AppRouterService>['router'];
@Injectable()
export class AppRouterService {
  readonly router;

  constructor(
    private trpc: TrpcService,
    private authRouter: AuthRouter,
  ) {
    this.router = this.trpc.router({
      auth: this.authRouter.router,
    });
  }
}
