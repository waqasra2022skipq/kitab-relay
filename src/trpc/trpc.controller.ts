import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { resolveResponse } from '@trpc/server/http';
import { TrpcService } from './trpc.service.js';
import { AppRouterService } from './routers/app.router.js';

@Controller('trpc')
export class TrpcController {
  constructor(
    private trpc: TrpcService,
    private appRouter: AppRouterService,
  ) {}

  @All('*')
  async handle(@Req() req: Request, @Res() res: Response) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }

    // tRPC v11 takes a standard Request object, not a plain object
    const trpcRequest = new Request(url.toString(), {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    const response = await resolveResponse({
      router: this.appRouter.router,
      req: trpcRequest,
      path: url.pathname.replace('/api/trpc/', ''),
      createContext: (opts) => this.trpc.createContext(opts),
      responseMeta: () => ({ status: 200 }),
    });

    res.status(response.status ?? 200);

    if (response.headers) {
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
    }

    res.send(response.body);
  }
}
