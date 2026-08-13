import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { AuthService, JwtPayload } from '../auth/auth.service.js';
import { ZodError } from 'zod';

// ─── Context Types ────────────────────────────────────────────

export interface TrpcContext {
  user: JwtPayload | null;
}
const trpc = initTRPC.context<TrpcContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

@Injectable()
export class TrpcService {
  readonly t = trpc;

  readonly router = trpc.router;
  readonly procedure = trpc.procedure;
  readonly protectedProcedure;

  constructor(private auth: AuthService) {
    this.protectedProcedure = trpc.procedure.use(
      trpc.middleware(({ ctx, next }) => {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
          });
        }

        return next({
          ctx: { user: ctx.user },
        });
      }),
    );
  }

  // ─── Build context from incoming HTTP request ───────────────

  async createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
    const authHeader = opts.req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authHeader.slice(7);

    try {
      const user = await this.auth.verifyToken(token);
      return { user };
    } catch {
      return { user: null };
    }
  }
}
