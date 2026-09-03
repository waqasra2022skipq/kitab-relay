import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import type { Environment } from './config/environment.js';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService<Environment, true>);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.enableCors({
    origin: config.get('WEB_ORIGIN', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.enableShutdownHooks();
}