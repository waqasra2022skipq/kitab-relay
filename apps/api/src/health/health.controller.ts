import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  LiveHealthResponse,
  ReadyHealthResponse,
} from './health.types.js';

@ApiTags('health')
@Controller({path: 'health', version: '1'})
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Report whether the API process is alive' })
  live(): LiveHealthResponse {
    return this.health.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Report whether required API dependencies are ready' })
  async ready(): Promise<ReadyHealthResponse> {
    return this.health.ready();
  }
}