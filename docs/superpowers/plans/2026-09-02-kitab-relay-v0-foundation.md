# Kitab Relay V0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a tested, documented vertical slice in which a Next.js page uses a generated OpenAPI client to call versioned NestJS liveness and PostgreSQL readiness endpoints.

**Architecture:** A pnpm workspace contains an independently runnable Next.js web application, NestJS modular-monolith API, and generated TypeScript API-client package. PostgreSQL runs locally in Docker Compose; NestJS alone owns database access and publishes the REST/OpenAPI contract.

**Tech Stack:** Node.js 24 LTS, pnpm 11, TypeScript, NestJS 12, Next.js 16 App Router, PostgreSQL 17, Prisma 7, OpenAPI, openapi-typescript, openapi-fetch, Vitest, Supertest, Docker Compose, GitHub Actions

**Spec:** `docs/superpowers/specs/2026-09-02-book-marketplace-master-design.md`

## Global Constraints

- Work from `/var/www/html/kitab-relay` unless a step explicitly changes directory.
- Build V0 on `feature/v0-foundation`, branched from the existing clean `master` branch.
- Preserve the existing Git history; do not reinitialize Git, rename `master`, or restore the implementation removed by commit `88d7e81`.
- Use Node.js 24.x; the initial machine is expected to report `v24.16.0`.
- Pin pnpm to `11.25.0` through the root `packageManager` field.
- Scaffold with NestJS CLI `12.0.0` and Next.js `16.3.4`.
- Use Prisma `7.10.0`, the current stable release; do not use the Prisma 8 release candidate.
- Use PostgreSQL `17-alpine` locally.
- Run the web application on port `3000` and the API on port `4000`.
- Use ESM for new Node.js packages.
- Keep TypeScript strict; do not use `any` to silence errors.
- Enter application code manually and inspect generated CLI output before editing it.
- Do not add authentication, catalogue entities, listings, Redis, Python, payments, object storage, or deployment providers in V0.
- Every task ends with a focused commit after its verification commands pass.

---

## V0 delivery map

| Week | Tasks | Demonstrable result |
|---|---|---|
| Week 1 | Tasks 1-3 | Reproducible monorepo; both generated applications lint, type-check, test, and build |
| Week 2 | Tasks 4-5 | PostgreSQL-backed readiness and standalone liveness endpoints with OpenAPI and tests |
| Week 3 | Tasks 6-8 | Generated client, Next.js status page, CI, documentation, and V0 demonstration |

---

### Task 1: Create the feature branch and workspace contract

**Learning outcome:** Understand what Git, Corepack, the root package manifest, and pnpm workspaces each control.

**Files:**

- Copy into the repository: `docs/superpowers/specs/2026-09-02-book-marketplace-master-design.md`
- Copy into the repository: `docs/superpowers/plans/2026-09-02-kitab-relay-v0-foundation.md`
- Create: `.nvmrc`
- Create: `.editorconfig`
- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`

**Interfaces:**

- Consumes: Node.js 24 and Corepack from the development machine.
- Produces: An isolated feature branch and pnpm workspace into which all later applications and packages are installed.

- [ ] **Step 1: Verify the runtime rather than assuming it**

Run:

```bash
node --version
corepack --version
```

Expected: Node prints `v24.x`; Corepack prints a version rather than “command not found.” Do not continue on an older Node major.

- [ ] **Step 2: Confirm the existing clean baseline and create the feature branch**

Run:

```bash
cd /var/www/html/kitab-relay
git status --short --branch
git switch -c feature/v0-foundation
git branch --show-current
git status --short
```

Expected: the first status reports clean `master`; branch creation succeeds; `git branch --show-current` prints `feature/v0-foundation`; final short status is empty.

- [ ] **Step 3: Copy the approved design and implementation plan into the repository**

Run:

```bash
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp /home/waqas/Documents/Codex/2026-09-02/my-x20/docs/superpowers/specs/2026-09-02-book-marketplace-master-design.md docs/superpowers/specs/
cp /home/waqas/Documents/Codex/2026-09-02/my-x20/docs/superpowers/plans/2026-09-02-kitab-relay-v0-foundation.md docs/superpowers/plans/
```

Expected: `git status --short` shows only the new `docs/` directory.

- [ ] **Step 4: Create the root package manifest**

Create `package.json`:

```json
{
  "name": "kitab-relay",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.25.0",
  "engines": {
    "node": ">=24.0.0 <25",
    "pnpm": ">=11.0.0 <12"
  },
  "scripts": {
    "build": "pnpm -r --if-present run build",
    "lint": "pnpm -r --if-present run lint",
    "test": "pnpm -r --if-present run test",
    "typecheck": "pnpm -r --if-present run typecheck"
  }
}
```

Understand: `private` prevents accidental npm publication; `packageManager` pins the package manager; `engines` documents accepted runtime majors.

- [ ] **Step 5: Declare workspace package locations**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"
```

- [ ] **Step 6: Pin Node and basic editor behavior**

Create `.nvmrc`:

```text
24
```

Create `.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 7: Protect generated and secret files**

Create `.gitignore`:

```gitignore
node_modules/
.pnpm-store/
dist/
.next/
coverage/
playwright-report/
test-results/
*.log

.env
.env.*
!.env.example
!.env.*.example

apps/api/src/generated/prisma/
```

- [ ] **Step 8: Activate the pinned pnpm and create the lockfile**

Run:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm --version
pnpm install
```

Expected: pnpm prints `11.25.0` and creates `pnpm-lock.yaml` without installing application dependencies yet.

- [ ] **Step 9: Verify and commit the workspace contract**

Run:

```bash
pnpm typecheck
git status --short
git add .editorconfig .gitignore .nvmrc package.json pnpm-lock.yaml pnpm-workspace.yaml docs
git commit -m "chore: initialize kitab relay workspace"
```

Expected: the recursive type-check exits successfully even though no child packages exist; Git creates the first commit.

**Checkpoint:** Explain the difference between the `packageManager` field, `engines`, and `pnpm-workspace.yaml` before continuing.

---

### Task 2: Scaffold and inspect the NestJS and Next.js applications

**Learning outcome:** Understand the files generated by each official CLI and establish the frontend/backend boundary without writing product behavior.

**Files:**

- Create through CLI: `apps/api/**`
- Create through CLI: `apps/web/**`
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Modify: root `package.json`

**Interfaces:**

- Consumes: The pnpm workspace from Task 1.
- Produces: `@kitab-relay/api` and `@kitab-relay/web`, each with `dev`, `build`, `lint`, `test`, and `typecheck` scripts where applicable.

- [ ] **Step 1: Create application directories**

Run:

```bash
mkdir -p apps packages infrastructure/docker
```

- [ ] **Step 2: Scaffold NestJS in strict ESM mode**

Run:

```bash
pnpm dlx @nestjs/cli@12.0.0 new apps/api --package-manager pnpm --strict --skip-git
```

If the CLI asks for a module system, select **ESM**. Do not accept CommonJS for this project.

Expected: `apps/api/src/main.ts`, `app.module.ts`, controller/service examples, Vitest configuration, and an application package manifest exist.

- [ ] **Step 3: Inspect the NestJS scaffold before changing it**

Run:

```bash
find apps/api/src -maxdepth 2 -type f | sort
pnpm --dir apps/api test
pnpm --dir apps/api build
```

Expected: the generated test passes and the NestJS build completes. Identify the controller, provider, module, bootstrap file, and test runner configuration.

- [ ] **Step 4: Scaffold Next.js with the App Router**

Run:

```bash
pnpm create next-app@16.3.4 apps/web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
```

Expected: `apps/web/src/app/page.tsx`, `layout.tsx`, global styles, ESLint configuration, and a package manifest exist.

- [ ] **Step 5: Inspect the Next.js scaffold before changing it**

Run:

```bash
find apps/web/src -maxdepth 3 -type f | sort
pnpm --dir apps/web lint
pnpm --dir apps/web build
```

Expected: lint and production build pass. Identify which components execute on the server by default.

- [ ] **Step 6: Normalize package names and scripts**

In `apps/api/package.json`:

- Set `"name": "@kitab-relay/api"`.
- Keep `"private": true`.
- Add `"dev": "nest start --watch"`.
- Add `"typecheck": "tsc --noEmit"`.

In `apps/web/package.json`:

- Set `"name": "@kitab-relay/web"`.
- Keep `"private": true`.
- Do not add a test script yet; Task 7 adds it together with Vitest.
- Add `"typecheck": "tsc --noEmit"`.

Do not replace framework-generated dependency versions manually.

- [ ] **Step 7: Add root development commands**

Extend the root `scripts` object with:

```json
{
  "dev": "pnpm --parallel --filter @kitab-relay/api --filter @kitab-relay/web run dev",
  "dev:api": "pnpm --filter @kitab-relay/api run dev",
  "dev:web": "pnpm --filter @kitab-relay/web run dev"
}
```

Merge these entries with the existing root scripts; do not replace `build`, `lint`, `test`, or `typecheck`.

- [ ] **Step 8: Verify both applications through the root**

Run:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: both applications lint and build; the NestJS generated test passes. The Next.js test script is allowed to report no test files only until Task 7.

- [ ] **Step 9: Commit the generated applications**

Run:

```bash
git add apps package.json pnpm-lock.yaml
git commit -m "chore: scaffold nest and next applications"
```

**Checkpoint:** Describe why Next.js will not import Prisma or access the database directly.

---

### Task 3: Share strict TypeScript defaults without hiding framework configuration

**Learning outcome:** Learn configuration inheritance while preserving NestJS- and Next.js-specific compiler behavior.

**Files:**

- Create: `packages/typescript-config/package.json`
- Create: `packages/typescript-config/base.json`
- Modify: `apps/api/tsconfig.json`
- Modify: `apps/web/tsconfig.json`

**Interfaces:**

- Consumes: Generated application TypeScript configurations from Task 2.
- Produces: A shared strict baseline extended by both applications.

- [ ] **Step 1: Create the configuration package**

Create `packages/typescript-config/package.json`:

```json
{
  "name": "@kitab-relay/typescript-config",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json"]
}
```

Create `packages/typescript-config/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 2: Extend the baseline from NestJS**

Add this top-level property to `apps/api/tsconfig.json`, preserving all generated NestJS compiler settings:

```json
{
  "extends": "../../packages/typescript-config/base.json"
}
```

Remove a generated compiler option only if it directly overrides one of the strict options above with a weaker value.

- [ ] **Step 3: Extend the baseline from Next.js**

Add this top-level property to `apps/web/tsconfig.json`, preserving Next.js `plugins`, `jsx`, module, path-alias, and include/exclude settings:

```json
{
  "extends": "../../packages/typescript-config/base.json"
}
```

- [ ] **Step 4: Prove that the strict baseline is active**

Temporarily add the following function to `apps/api/src/app.service.ts`:

```ts
export function strictnessProbe(values: string[]): string {
  return values[0].toUpperCase();
}
```

Run:

```bash
pnpm --filter @kitab-relay/api typecheck
```

Expected: FAIL because `values[0]` can be `undefined` under `noUncheckedIndexedAccess`.

- [ ] **Step 5: Remove the probe and verify both applications**

Delete `strictnessProbe`, then run:

```bash
pnpm typecheck
pnpm build
```

Expected: both commands pass.

- [ ] **Step 6: Commit the strict configuration**

Run:

```bash
git add packages/typescript-config apps/api/tsconfig.json apps/web/tsconfig.json pnpm-lock.yaml
git commit -m "chore: share strict typescript defaults"
```

**Checkpoint:** Explain why `noUncheckedIndexedAccess` caught a bug that ordinary `strict` mode did not.

---

### Task 4: Add validated configuration and local PostgreSQL

**Learning outcome:** Separate configuration from code, fail fast on invalid environments, and run a reproducible database without installing PostgreSQL on the host.

**Files:**

- Create: `infrastructure/docker/compose.yml`
- Create: `apps/api/.env.example`
- Create locally but do not commit: `apps/api/.env`
- Create: `apps/api/src/config/environment.ts`
- Test: `apps/api/src/config/environment.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: Docker and the NestJS application.
- Produces: Validated `PORT`, `DATABASE_URL`, `WEB_ORIGIN`, and `NODE_ENV`; a healthy local PostgreSQL service at port 5432.

- [ ] **Step 1: Add configuration dependencies**

Run:

```bash
pnpm --filter @kitab-relay/api add @nestjs/config zod
```

- [ ] **Step 2: Write the failing environment tests**

Create `apps/api/src/config/environment.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment.js';

describe('validateEnvironment', () => {
  it('coerces and accepts a complete development environment', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'development',
        PORT: '4000',
        DATABASE_URL: 'postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay',
        WEB_ORIGIN: 'http://localhost:3000',
      }),
    ).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      DATABASE_URL: 'postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay',
      WEB_ORIGIN: 'http://localhost:3000',
    });
  });

  it('rejects a missing database URL', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'test',
        PORT: '4000',
        WEB_ORIGIN: 'http://localhost:3000',
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 3: Run the focused test and observe the intended failure**

Run:

```bash
pnpm --filter @kitab-relay/api test -- src/config/environment.spec.ts
```

Expected: FAIL because `environment.js` does not exist.

- [ ] **Step 4: Implement environment parsing**

Create `apps/api/src/config/environment.ts`:

```ts
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  values: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(values);
}
```

- [ ] **Step 5: Run the environment tests**

Run:

```bash
pnpm --filter @kitab-relay/api test -- src/config/environment.spec.ts
```

Expected: both tests pass.

- [ ] **Step 6: Register global configuration**

Replace `apps/api/src/app.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
  ],
})
export class AppModule {}
```

The generated controller and service become unused now; remove these exact files:

```text
apps/api/src/app.controller.ts
apps/api/src/app.controller.spec.ts
apps/api/src/app.service.ts
```

- [ ] **Step 7: Define local PostgreSQL**

Create `infrastructure/docker/compose.yml`:

```yaml
name: kitab-relay

services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: kitab_relay
      POSTGRES_USER: kitab_relay
      POSTGRES_PASSWORD: kitab_relay
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kitab_relay -d kitab_relay"]
      interval: 5s
      timeout: 3s
      retries: 10
    volumes:
      - kitab_relay_postgres:/var/lib/postgresql/data

volumes:
  kitab_relay_postgres:
```

- [ ] **Step 8: Document and create the API environment**

Create `apps/api/.env.example`:

```dotenv
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay
WEB_ORIGIN=http://localhost:3000
```

Manually copy it to the ignored development file:

```bash
cp apps/api/.env.example apps/api/.env
```

- [ ] **Step 9: Start and inspect PostgreSQL**

Run:

```bash
docker compose -f infrastructure/docker/compose.yml up -d
docker compose -f infrastructure/docker/compose.yml ps
```

Expected: `postgres` becomes `healthy` and port `5432` is published.

- [ ] **Step 10: Verify and commit configuration**

Run:

```bash
pnpm --filter @kitab-relay/api lint
pnpm --filter @kitab-relay/api typecheck
pnpm --filter @kitab-relay/api test
pnpm --filter @kitab-relay/api build
git status --short
```

Expected: all commands pass and `apps/api/.env` is absent from Git status.

Run:

```bash
git add apps/api infrastructure/docker pnpm-lock.yaml
git commit -m "feat(api): validate config and add local postgres"
```

**Checkpoint:** Explain why `.env.example` is committed while `.env` is ignored.

---

### Task 5: Connect Prisma and implement versioned health endpoints test-first

**Learning outcome:** Integrate a database through a NestJS infrastructure module, distinguish liveness from readiness, and test success and failure behavior.

**Files:**

- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma.config.ts`
- Create generated but ignore: `apps/api/src/generated/prisma/**`
- Create: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/database/prisma.service.ts`
- Create: `apps/api/src/health/health.types.ts`
- Create: `apps/api/src/health/health.service.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.module.ts`
- Test: `apps/api/src/health/health.service.spec.ts`
- Test: `apps/api/test/health.e2e-spec.ts`
- Create: `apps/api/src/app.setup.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: `DATABASE_URL` validated in Task 4 and PostgreSQL at port 5432.
- Produces: `GET /api/v1/health/live` and `GET /api/v1/health/ready`.

- [ ] **Step 1: Install stable Prisma and PostgreSQL adapter packages**

Run:

```bash
pnpm --filter @kitab-relay/api add @prisma/client@7.10.0 @prisma/adapter-pg@7.10.0 pg dotenv
pnpm --filter @kitab-relay/api add -D prisma@7.10.0 @types/pg
```

- [ ] **Step 2: Define Prisma configuration without product entities**

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

Create `apps/api/prisma.config.ts`:

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

Add these scripts to `apps/api/package.json`:

```json
{
  "db:generate": "prisma generate",
  "db:format": "prisma format"
}
```

- [ ] **Step 3: Generate the Prisma client**

Run:

```bash
pnpm --dir apps/api db:format
pnpm --dir apps/api db:generate
```

Expected: Prisma generates TypeScript under `apps/api/src/generated/prisma`; Git ignores that directory.

- [ ] **Step 4: Add the database infrastructure module**

Create `apps/api/src/database/prisma.service.ts`:

```ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Environment } from '../config/environment.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Environment, true>) {
    const connectionString = config.get('DATABASE_URL', { infer: true });
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

Create `apps/api/src/database/database.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

- [ ] **Step 5: Write failing health-service tests**

Create `apps/api/src/health/health.service.spec.ts`:

```ts
import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../database/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports liveness without querying the database', () => {
    const query = vi.fn();
    const service = new HealthService({
      $queryRawUnsafe: query,
    } as unknown as PrismaService);

    expect(service.live()).toEqual({
      status: 'ok',
      service: 'kitab-relay-api',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('reports readiness after a successful database probe', async () => {
    const service = new HealthService({
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ result: 1 }]),
    } as unknown as PrismaService);

    await expect(service.ready()).resolves.toEqual({
      status: 'ok',
      service: 'kitab-relay-api',
      checks: { database: 'up' },
    });
  });

  it('returns a service-unavailable error when the database probe fails', async () => {
    const service = new HealthService({
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('offline')),
    } as unknown as PrismaService);

    await expect(service.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
```

- [ ] **Step 6: Run the focused test and confirm the missing implementation**

Run:

```bash
pnpm --filter @kitab-relay/api test -- src/health/health.service.spec.ts
```

Expected: FAIL because `HealthService` does not exist.

- [ ] **Step 7: Implement health response types and service**

Create `apps/api/src/health/health.types.ts`:

```ts
export interface LiveHealthResponse {
  status: 'ok';
  service: 'kitab-relay-api';
}

export interface ReadyHealthResponse extends LiveHealthResponse {
  checks: {
    database: 'up';
  };
}
```

Create `apps/api/src/health/health.service.ts`:

```ts
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  LiveHealthResponse,
  ReadyHealthResponse,
} from './health.types.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  live(): LiveHealthResponse {
    return { status: 'ok', service: 'kitab-relay-api' };
  }

  async ready(): Promise<ReadyHealthResponse> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1 AS result');
      return {
        status: 'ok',
        service: 'kitab-relay-api',
        checks: { database: 'up' },
      };
    } catch (cause: unknown) {
      throw new ServiceUnavailableException(
        {
          status: 'error',
          service: 'kitab-relay-api',
          checks: { database: 'down' },
        },
        { cause },
      );
    }
  }
}
```

- [ ] **Step 8: Run the health-service tests**

Run:

```bash
pnpm --filter @kitab-relay/api test -- src/health/health.service.spec.ts
```

Expected: all three tests pass.

- [ ] **Step 9: Expose health behavior through a module and controller**

Create `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import type {
  LiveHealthResponse,
  ReadyHealthResponse,
} from './health.types.js';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get('live')
  @ApiOperation({ summary: 'Report whether the API process is alive' })
  live(): LiveHealthResponse {
    return this.health.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Report whether required API dependencies are ready' })
  ready(): Promise<ReadyHealthResponse> {
    return this.health.ready();
  }
}
```

Create `apps/api/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

Install Swagger:

```bash
pnpm --filter @kitab-relay/api add @nestjs/swagger
```

- [ ] **Step 10: Configure the NestJS request boundary once**

Create `apps/api/src/app.setup.ts`:

```ts
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
```

Replace `apps/api/src/app.module.ts` with:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from './config/environment.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
```

Replace `apps/api/src/main.ts` with:

```ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import type { Environment } from './config/environment.js';

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
```

- [ ] **Step 11: Write failing endpoint tests**

Create `apps/api/test/health.e2e-spec.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, beforeEach, afterEach, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('health endpoints', () => {
  let app: INestApplication;
  const query = vi.fn();

  beforeEach(async () => {
    query.mockReset();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRawUnsafe: query })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health/live does not require PostgreSQL', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/health/live')
      .expect(200)
      .expect({ status: 'ok', service: 'kitab-relay-api' });
    expect(query).not.toHaveBeenCalled();
  });

  it('GET /api/v1/health/ready reports a healthy database', async () => {
    query.mockResolvedValue([{ result: 1 }]);
    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'kitab-relay-api',
        checks: { database: 'up' },
      });
  });

  it('GET /api/v1/health/ready returns 503 when PostgreSQL is unavailable', async () => {
    query.mockRejectedValue(new Error('offline'));
    const response = await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(503);
    expect(response.body.checks).toEqual({ database: 'down' });
  });
});
```

- [ ] **Step 12: Run all API tests and correct only evidence-backed failures**

Run:

```bash
pnpm --filter @kitab-relay/api test
```

Expected: environment, health-service, and health endpoint tests pass.

- [ ] **Step 13: Verify the real PostgreSQL readiness path**

Terminal 1:

```bash
pnpm dev:api
```

Terminal 2:

```bash
curl --fail http://localhost:4000/api/v1/health/live
curl --fail http://localhost:4000/api/v1/health/ready
curl --fail http://localhost:4000/api/docs-json
```

Expected: liveness and readiness return `status: ok`; the OpenAPI JSON contains both versioned health paths.

- [ ] **Step 14: Verify and commit the API foundation**

Run:

```bash
pnpm --filter @kitab-relay/api lint
pnpm --filter @kitab-relay/api typecheck
pnpm --filter @kitab-relay/api test
pnpm --filter @kitab-relay/api build
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): add database health contract"
```

**Checkpoint:** Explain why liveness must not query PostgreSQL while readiness should.

---

### Task 6: Generate and package the OpenAPI client

**Learning outcome:** Treat the HTTP schema as the integration contract and eliminate hand-written duplication of response types.

**Files:**

- Create: `apps/api/scripts/generate-openapi.ts`
- Create generated and commit: `apps/api/openapi.json`
- Modify: `apps/api/package.json`
- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create generated and commit: `packages/api-client/src/schema.ts`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/index.ts`
- Modify: root `package.json`

**Interfaces:**

- Consumes: NestJS controllers and Swagger metadata from Task 5.
- Produces: `createKitabRelayClient(baseUrl)` with paths generated from `apps/api/openapi.json`.

- [ ] **Step 1: Add the OpenAPI generation runtime**

Run:

```bash
pnpm --filter @kitab-relay/api add -D tsx
```

- [ ] **Step 2: Create the API document generator**

Create `apps/api/scripts/generate-openapi.ts`:

```ts
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
```

Add to `apps/api/package.json`:

```json
{
  "openapi:generate": "tsx scripts/generate-openapi.ts"
}
```

- [ ] **Step 3: Generate and inspect the API contract**

Run:

```bash
pnpm --dir apps/api openapi:generate
node -e "const d=require('./apps/api/openapi.json'); console.log(Object.keys(d.paths))"
```

Expected output includes:

```text
/api/v1/health/live
/api/v1/health/ready
```

- [ ] **Step 4: Create the API-client package**

Create `packages/api-client/package.json`:

```json
{
  "name": "@kitab-relay/api-client",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "generate": "openapi-typescript ../../apps/api/openapi.json -o src/schema.ts",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "openapi-fetch": "0.17.0"
  },
  "devDependencies": {
    "openapi-typescript": "7.13.0",
    "typescript": "7.0.2"
  }
}
```

Create `packages/api-client/tsconfig.json`:

```json
{
  "extends": "../typescript-config/base.json",
  "compilerOptions": {
    "declaration": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "target": "ES2023"
  },
  "include": ["src/**/*.ts"]
}
```

Create `packages/api-client/src/client.ts`:

```ts
import createClient from 'openapi-fetch';
import type { paths } from './schema.js';

export function createKitabRelayClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
```

Create `packages/api-client/src/index.ts`:

```ts
export { createKitabRelayClient } from './client.js';
export type { paths } from './schema.js';
```

- [ ] **Step 5: Install, generate, and build the package**

Run:

```bash
pnpm install
pnpm --filter @kitab-relay/api-client generate
pnpm --filter @kitab-relay/api-client typecheck
pnpm --filter @kitab-relay/api-client build
```

Expected: `src/schema.ts` contains the two health paths and `dist/` contains JavaScript and declarations, including `schema.js` and `schema.d.ts`.

- [ ] **Step 6: Add one root contract command**

Extend the root `scripts` object with:

```json
{
  "contract:generate": "pnpm --dir apps/api openapi:generate && pnpm --filter @kitab-relay/api-client generate"
}
```

- [ ] **Step 7: Prove contract drift is visible**

Run:

```bash
git add apps/api/openapi.json packages/api-client/src/schema.ts
pnpm contract:generate
git diff --exit-code apps/api/openapi.json packages/api-client/src/schema.ts
```

Expected: no working-tree diff against the staged generated files. Later CI uses the same generation-and-diff idea to detect a controller change whose generated contract was not committed.

- [ ] **Step 8: Commit the contract boundary**

Run:

```bash
git add apps/api/openapi.json apps/api/package.json apps/api/scripts packages/api-client package.json pnpm-lock.yaml
git commit -m "feat: generate typed api client from openapi"
```

**Checkpoint:** Explain why importing backend DTO classes directly into Next.js would be a weaker boundary than generating types from OpenAPI.

---

### Task 7: Render API health in Next.js and test the presentation behavior

**Learning outcome:** Consume a workspace package from a Server Component, keep environment configuration server-only, and design deliberate healthy and unavailable states.

**Files:**

- Create: `apps/web/.env.local.example`
- Create locally but do not commit: `apps/web/.env.local`
- Create: `apps/web/src/lib/environment.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/components/api-status.tsx`
- Test: `apps/web/src/components/api-status.test.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`

**Interfaces:**

- Consumes: `createKitabRelayClient` from Task 6 and `GET /api/v1/health/ready` from Task 5.
- Produces: A page at `http://localhost:3000` showing whether the API and database are ready.

- [ ] **Step 1: Add the workspace client and test libraries**

Run:

```bash
pnpm --filter @kitab-relay/web add @kitab-relay/api-client@workspace:*
pnpm --filter @kitab-relay/web add -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Configure Vitest for React**

Create `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

Create `apps/web/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Confirm `apps/web/package.json` contains:

```json
{
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 3: Write the failing presentation tests**

Create `apps/web/src/components/api-status.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiStatus } from './api-status';

describe('ApiStatus', () => {
  it('shows a ready state', () => {
    render(<ApiStatus ready />);
    expect(screen.getByText('API and database ready')).toBeInTheDocument();
  });

  it('shows an unavailable state', () => {
    render(<ApiStatus ready={false} />);
    expect(screen.getByText('API unavailable')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the focused test and confirm the missing component**

Run:

```bash
pnpm --filter @kitab-relay/web test -- src/components/api-status.test.tsx
```

Expected: FAIL because `api-status.tsx` does not exist.

- [ ] **Step 5: Implement the status component**

Create `apps/web/src/components/api-status.tsx`:

```tsx
interface ApiStatusProps {
  ready: boolean;
}

export function ApiStatus({ ready }: ApiStatusProps) {
  return (
    <section aria-live="polite" className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">System status</h2>
      <p className={ready ? 'text-emerald-700' : 'text-red-700'}>
        {ready ? 'API and database ready' : 'API unavailable'}
      </p>
    </section>
  );
}
```

Run:

```bash
pnpm --filter @kitab-relay/web test -- src/components/api-status.test.tsx
```

Expected: both tests pass.

- [ ] **Step 6: Add server-only environment validation**

Create `apps/web/.env.local.example`:

```dotenv
API_BASE_URL=http://localhost:4000
```

Copy it locally:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Create `apps/web/src/lib/environment.ts`:

```ts
import 'server-only';

const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('API_BASE_URL is required');
}

export const environment = {
  apiBaseUrl,
} as const;
```

- [ ] **Step 7: Create the server-only API client**

Create `apps/web/src/lib/api.ts`:

```ts
import 'server-only';
import { createKitabRelayClient } from '@kitab-relay/api-client';
import { environment } from './environment';

export const api = createKitabRelayClient(environment.apiBaseUrl);
```

- [ ] **Step 8: Replace the generated home page with the V0 vertical slice**

Replace `apps/web/src/app/page.tsx` with:

```tsx
import { ApiStatus } from '@/components/api-status';
import { api } from '@/lib/api';

export default async function Home() {
  let ready = false;

  try {
    const { response } = await api.GET('/api/v1/health/ready', {
      cache: 'no-store',
    });
    ready = response.ok;
  } catch {
    ready = false;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
          V0 Foundation
        </p>
        <h1 className="text-4xl font-bold">Kitab Relay</h1>
        <p className="mt-2 text-slate-600">
          Helping physical books move to their next reader.
        </p>
      </header>
      <ApiStatus ready={ready} />
    </main>
  );
}
```

- [ ] **Step 9: Ensure the client builds before application development**

Update the root `dev` script to:

```json
{
  "dev": "pnpm --filter @kitab-relay/api-client build && pnpm --parallel --filter @kitab-relay/api --filter @kitab-relay/web run dev"
}
```

- [ ] **Step 10: Run automated verification**

Run:

```bash
pnpm --filter @kitab-relay/api-client build
pnpm --filter @kitab-relay/web lint
pnpm --filter @kitab-relay/web typecheck
pnpm --filter @kitab-relay/web test
pnpm --filter @kitab-relay/web build
```

Expected: all checks pass. The Next.js production build uses `API_BASE_URL` from `.env.local`.

- [ ] **Step 11: Demonstrate success and failure behavior manually**

With PostgreSQL running, execute:

```bash
pnpm dev
```

Open `http://localhost:3000` and confirm “API and database ready.” Then stop only PostgreSQL:

```bash
docker compose -f infrastructure/docker/compose.yml stop postgres
```

Refresh and confirm “API unavailable.” Restore PostgreSQL:

```bash
docker compose -f infrastructure/docker/compose.yml start postgres
```

- [ ] **Step 12: Commit the first vertical UI slice**

Run:

```bash
git add apps/web package.json packages/api-client pnpm-lock.yaml
git commit -m "feat(web): display api readiness"
```

**Checkpoint:** Explain why `API_BASE_URL` is not prefixed with `NEXT_PUBLIC_` and where the health request executes.

---

### Task 8: Add CI, operator documentation, and the V0 retrospective

**Learning outcome:** Turn local success into a reproducible quality gate and communicate the architecture to another engineer.

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Create: `docs/decisions/0001-separate-web-and-api.md`
- Create: `docs/architecture/v0-system.md`
- Create during review: `docs/retrospectives/v0.md`
- Modify: root `package.json`

**Interfaces:**

- Consumes: All V0 packages and verification commands.
- Produces: CI enforcement, reproducible setup instructions, an architectural decision record, and documented learning evidence.

- [ ] **Step 1: Add deterministic verification scripts**

Extend root `package.json` scripts with:

```json
{
  "verify": "pnpm --filter @kitab-relay/api-client build && pnpm lint && pnpm typecheck && pnpm test && pnpm build",
  "contract:check": "pnpm contract:generate && git diff --exit-code apps/api/openapi.json packages/api-client/src/schema.ts"
}
```

- [ ] **Step 2: Create the GitHub Actions workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      NODE_ENV: test
      PORT: 4000
      DATABASE_URL: postgresql://kitab_relay:kitab_relay@localhost:5432/kitab_relay
      WEB_ORIGIN: http://localhost:3000
      API_BASE_URL: http://localhost:4000
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.25.0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --dir apps/api db:generate
      - run: pnpm contract:check
      - run: pnpm verify
```

The V0 test suite mocks the database for endpoints, so CI does not need a PostgreSQL service yet. V1 integration tests will add an isolated CI database.

- [ ] **Step 3: Create the architectural decision record**

Create `docs/decisions/0001-separate-web-and-api.md`:

```markdown
# ADR 0001: Separate Next.js Web and NestJS API

## Status

Accepted on 2026-09-02.

## Context

Kitab Relay is a learning-first marketplace. NestJS backend architecture and Next.js frontend architecture are both explicit learning goals. A Next.js-only application would ship faster but would hide the backend boundary; microservices would add operational complexity before product scale requires it.

## Decision

Use a Next.js web application and a separate NestJS REST API in one pnpm workspace. NestJS owns business rules and PostgreSQL. OpenAPI is the contract, and the web application consumes generated types through `@kitab-relay/api-client`.

## Consequences

The project must manage two application processes, CORS, environment-specific URLs, and contract generation. In return, backend boundaries, HTTP behavior, independent testing, and later deployment choices remain explicit and explainable.
```

- [ ] **Step 4: Document the V0 runtime architecture**

Create `docs/architecture/v0-system.md`:

````markdown
# V0 System Architecture

```text
Browser :3000
    |
    v
Next.js Server Component
    |
    | generated OpenAPI client over HTTP
    v
NestJS API :4000
    |
    | Prisma with PostgreSQL driver adapter
    v
PostgreSQL :5432
```

The browser requests the Next.js page. The Next.js server calls NestJS readiness. NestJS executes `SELECT 1` through Prisma. The browser receives rendered status markup; it does not receive the private API base URL or database credentials.

Liveness checks only the API process. Readiness checks PostgreSQL because the API cannot provide marketplace behavior without its durable store.
````

- [ ] **Step 5: Write the project README**

Create `README.md` with these complete sections and commands:

````markdown
# Kitab Relay

Kitab Relay helps physical books move to their next reader through sale, donation, and free lending. V0 establishes the technical foundation; marketplace behavior begins in V1.

## Prerequisites

- Node.js 24
- Corepack
- Docker with Docker Compose
- Git

## Setup

```bash
corepack enable
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
docker compose -f infrastructure/docker/compose.yml up -d
pnpm --dir apps/api db:generate
pnpm contract:generate
pnpm --filter @kitab-relay/api-client build
```

## Development

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1/health/live
- API documentation: http://localhost:4000/api/docs

## Verification

```bash
pnpm contract:check
pnpm verify
```

## Architecture

Next.js and NestJS are separate applications. NestJS owns persistence and publishes an OpenAPI contract. The generated client package is the only typed API boundary used by the frontend. See `docs/architecture/v0-system.md` and `docs/decisions/0001-separate-web-and-api.md`.

## Current scope

V0 contains infrastructure and health behavior only. It intentionally excludes accounts, books, listings, lending, school sets, Python services, payments, and production deployment.
````

- [ ] **Step 6: Run the clean-machine rehearsal locally**

From the repository root, run the README commands in order, then:

```bash
pnpm contract:check
pnpm verify
git status --short
```

Expected: all checks pass. Only intended documentation and CI files are uncommitted. Generated client drift is empty.

- [ ] **Step 7: Record the V0 retrospective in your own words**

Create `docs/retrospectives/v0.md` and answer these prompts with concrete examples from the completed work:

```markdown
# V0 Retrospective

## What I can now explain

- How pnpm resolves workspace packages
- Why the web and API are separate
- How NestJS dependency injection built the health flow
- How configuration validation fails fast
- Difference between liveness and readiness
- How OpenAPI produced frontend types
- What CI verifies

## Evidence

Record the exact test, type-check, build, and manual demonstration results.

## Difficulties and resolutions

Describe actual failures encountered, the evidence used to diagnose them, and the correction.

## V1 adjustments

Record any pace, tooling, or architectural adjustment that should influence the V1 catalogue design.
```

Do not write generic statements such as “learned a lot.” Use commands, errors, decisions, and observed behavior.

- [ ] **Step 8: Commit and tag V0**

Run:

```bash
git add .github README.md docs package.json pnpm-lock.yaml
git commit -m "docs: complete v0 foundation"
git tag -a v0.0.0 -m "Kitab Relay V0 foundation"
git status --short
```

Expected: clean working tree and annotated tag `v0.0.0`.

- [ ] **Step 9: Final V0 verification**

Run:

```bash
pnpm contract:check
pnpm verify
curl --fail http://localhost:4000/api/v1/health/live
curl --fail http://localhost:4000/api/v1/health/ready
```

Expected:

- Generated OpenAPI and client types are current.
- Lint, type-check, tests, and builds all pass.
- Both health requests return HTTP 200.
- The browser page reports “API and database ready.”

**Checkpoint:** Give a five-minute verbal walkthrough of the request from the browser, through Next.js and NestJS, to PostgreSQL and back.

---

## V0 completion criteria

V0 is complete only when all of the following are true:

- The repository is initialized and the working tree is clean.
- Node and pnpm versions are pinned.
- NestJS and Next.js run independently and together.
- PostgreSQL starts through Docker Compose and reports healthy.
- Invalid API environment configuration fails at startup.
- Liveness succeeds without a database query.
- Readiness succeeds with PostgreSQL and returns 503 when its probe fails.
- OpenAPI contains both versioned health endpoints.
- The generated client compiles and is consumed by Next.js.
- The web page deliberately handles ready and unavailable states.
- Root lint, type-check, test, build, and contract checks pass.
- GitHub Actions runs the same quality gates.
- README, architecture note, ADR, and retrospective exist.
- The final commit is tagged `v0.0.0`.

## Stop condition

Do not begin V1 automatically. Review the V0 retrospective, compare planned and actual hours, and approve the V1 catalogue design before creating its implementation plan.
