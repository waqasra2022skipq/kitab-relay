import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    this.client = new PrismaClient({ adapter });
  }
  async onModuleInit() {
    await this.client.$connect();
  }
  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get db(): PrismaClient {
    return this.client;
  }
}
