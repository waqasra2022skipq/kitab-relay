import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureApp } from './app.setup.js';
import type { Environment } from './config/environment.js';
import { ConfigService } from '@nestjs/config';



async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Kitab Relay API')
      .setDescription('REST API for the Kitab Relay marketplace')
      .setVersion('0.0.0')
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('PORT', { infer: true }));
}
void bootstrap();
