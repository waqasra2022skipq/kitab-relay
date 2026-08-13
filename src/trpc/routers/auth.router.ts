import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc.service.js';
import { AuthService } from '../../auth/auth.service.js';
import { z } from 'zod';

@Injectable()
export class AuthRouter {
  readonly router;
  constructor(
    private trpc: TrpcService,
    protected auth: AuthService,
  ) {
    this.router = this.trpc.router({
      register: this.trpc.procedure
        .input(
          z.object({
            email: z.string().email(),
            password: z.string().min(8),
            name: z.string().min(2),
            phone: z.string().optional(),
            city: z.string().optional(),
          }),
        )
        .mutation(async ({ input }) => {
          return this.auth.register(input);
        }),

      login: this.trpc.procedure
        .input(
          z.object({
            email: z.string().email(),
            password: z.string().min(8),
          }),
        )
        .mutation(async ({ input }) => {
          return this.auth.login(input);
        }),
    });
  }
}
