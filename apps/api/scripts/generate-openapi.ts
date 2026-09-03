import 'reflect-metadata';
import { writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

const app = await NestFactory.create(AppModule, { logger: false });
configureApp(app);
await app.init();

const document = SwaggerModule.createDocument(
  app,
  new DocumentBuilder()
    .setTitle('Kitab Relay API')
    .setDescription('REST API for the Kitab Relay marketplace')
    .setVersion('0.0.0')
    .build(),
);

await writeFile('openapi.json', `${JSON.stringify(document, null, 2)}\n`);
await app.close();