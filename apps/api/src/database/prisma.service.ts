import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from '../generated/prisma/client.js';
import type { Environment } from '../config/environment.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ConfigService) config: ConfigService<Environment, true>) {
    const connectionString = config.get('DATABASE_URL', { infer: true });
    super({ adapter: new PrismaPg({connectionString}) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

}
