# Kitab Relay Master Design

**Status:** Approved for planning  
**Date:** 2026-09-02  
**Purpose:** Learning-first side project and progressively deployable product

## 1. Product intent

Build **Kitab Relay**, a general marketplace in which people can list physical books for sale, donation, or free lending. The same product must also support school-book discovery and complete or partial school book sets.

The project has two equally important outcomes:

1. Develop demonstrable, interview-defensible skills in NestJS, Next.js, TypeScript, PostgreSQL, testing, architecture, deployment, and a focused Python service.
2. Produce a useful product incrementally without using production-scale infrastructure before the product needs it.

This is not a nationwide, fully managed commerce platform at launch. It starts as a small, working marketplace and gains operational complexity version by version.

## 2. Developer context and constraints

The developer is an experienced Laravel backend engineer with marketplace, REST API, relational database, authentication, and authorization experience. TypeScript familiarity is already sufficient to begin application development without a general JavaScript course.

Project constraints:

- Five focused development hours are available per week.
- The expected roadmap duration is approximately 10-12 months, with scope adjusted if actual velocity differs.
- Application code will be entered and run manually by the developer.
- AI-assisted IDE editing and opaque bulk code generation will not be part of the learning workflow.
- Each feature must be explained, tested, verified, and documented.
- Hosting providers and paid services will be selected only when the marketplace MVP is close to deployment.
- The architecture must remain deployable on conventional containers and managed infrastructure.

## 3. Chosen approach

Use a Next.js frontend and a separate NestJS REST API backed by PostgreSQL. The NestJS backend will begin as a modular monolith. A small Python service will be introduced only when book metadata extraction creates a real asynchronous processing requirement.

This approach was chosen over:

- A microservice architecture, which would add distributed-system overhead before scale or team boundaries justify it.
- A Next.js-only backend, which would weaken the main NestJS learning objective and create later extraction work.

## 4. System architecture

```text
Browser
   |
   v
Next.js web application
   |
   | HTTPS REST using generated API client
   v
NestJS modular monolith
   |        |        \
   |        |         \ asynchronous job, introduced in V7
   v        v          v
PostgreSQL S3-compatible Python book-intelligence service
           storage
                
Redis/BullMQ connects to NestJS when background jobs are required
```

Architectural rules:

1. NestJS owns business rules, authorization, persistence, and durable state.
2. Next.js never queries PostgreSQL directly.
3. REST and OpenAPI form the interface between frontend and backend.
4. The frontend consumes a generated API client rather than duplicating response types manually.
5. NestJS modules expose deliberate service interfaces and do not reach into another module's internal repositories.
6. Python processes bounded jobs and returns suggestions; it is not a second system of record.
7. Redis, queues, OCR, observability platforms, and external search engines are introduced only by a version that requires them.
8. Managed payments, escrow, COD, and courier integration remain outside the initial roadmap.

## 5. Repository structure

```text
kitab-relay/
|-- apps/
|   |-- web/                    # Next.js application
|   `-- api/                    # NestJS application
|-- services/
|   `-- book-intelligence/      # Python/FastAPI application, added in V7
|-- packages/
|   |-- api-client/             # Client generated from OpenAPI
|   |-- eslint-config/          # Shared lint configuration
|   `-- typescript-config/      # Shared strict TypeScript settings
|-- infrastructure/
|   `-- docker/                 # Local infrastructure definitions
|-- docs/
|   |-- architecture/           # Diagrams and architectural explanations
|   `-- decisions/              # Architecture Decision Records
|-- pnpm-workspace.yaml
`-- README.md
```

Use pnpm workspaces without Nx or Turborepo initially. Additional orchestration will be adopted only if workspace scripts and dependency ordering become difficult to maintain.

## 6. Technology choices

### 6.1 Foundation

- **Node.js 24 LTS:** supported production runtime for NestJS and Next.js.
- **pnpm workspaces:** dependency and monorepo management with a single lockfile.
- **Strict TypeScript:** shared compiler standards with application-specific extensions.
- **Docker Compose:** local PostgreSQL first; Redis and compatible object storage are added by later versions.
- **GitHub Actions:** lint, type-check, test, and production-build verification.

### 6.2 Frontend

- **Next.js App Router:** routing, layouts, Server Components, Client Components, loading states, error boundaries, metadata, and public search pages.
- **React:** interactive forms and marketplace workflows.
- **Tailwind CSS and shadcn/ui:** consistent interface construction from accessible primitives.
- **React Hook Form and Zod:** interactive form state and immediate client-side feedback.
- **Generated OpenAPI client:** typed calls to the NestJS API.
- **Vitest and Testing Library:** functions, hooks, and client component behavior.
- **Playwright:** critical browser journeys across both applications.

The frontend may perform optimistic presentation checks, but it never acts as the authoritative authorization layer.

### 6.3 Backend

- **NestJS REST API:** modules, dependency injection, controllers, services, pipes, guards, interceptors, exception filters, and lifecycle management.
- **OpenAPI through `@nestjs/swagger`:** executable API contract and documentation.
- **PostgreSQL:** relational integrity, transactions, indexes, search, and reporting.
- **Prisma:** typed persistence, schema migrations, and transaction APIs.
- **Class Validator and Class Transformer:** request DTO validation and transformation at the API boundary.
- **Vitest and Supertest:** isolated domain tests and API integration tests.

Raw SQL and query plans will still be taught where performance or PostgreSQL-specific behavior matters. Prisma does not replace database knowledge.

### 6.4 Authentication and security

NestJS owns email/password authentication. The implementation will include:

- Password hashing with Argon2id through a maintained Node.js implementation.
- Short-lived access credentials and renewable sessions.
- Secure, HTTP-only cookie transport for browser sessions.
- CSRF, CORS, cookie, and origin policy appropriate to the final deployment topology.
- Route guards and resource-level authorization.
- Account roles for users, moderators, and administrators.
- Rate limiting on authentication and abuse-sensitive endpoints.
- File type, size, and ownership checks for uploads.
- Audit records for moderation and important lifecycle changes.
- Secrets loaded through validated environment configuration and never committed.

Authentication mechanics will be specified in the V2 design before implementation so that deployment topology and cookie behavior are defined together.

### 6.5 Search and background work

- Begin with structured PostgreSQL filters.
- Add PostgreSQL full-text search and `pg_trgm` when title and author search require relevance and typo tolerance.
- Add Redis and BullMQ in V4 for durable notifications or in V7 for Python jobs, whichever produces the first demonstrated requirement.
- Do not introduce Elasticsearch, OpenSearch, Typesense, Kafka, RabbitMQ, or Kubernetes during the planned roadmap.

### 6.6 Python

The Python service will use FastAPI, Pydantic, pytest, and uv for dependency and environment management. Its initial responsibility is to accept an image or document-processing job, extract candidate book metadata through barcode/OCR techniques, and return confidence-scored suggestions.

NestJS will validate access, own uploaded-file records, submit jobs, store results, and require user confirmation before catalogue data changes. Python output is never trusted as authoritative data automatically.

## 7. Domain model

### 7.1 Catalogue identity

```text
Book
|-- title
|-- description
|-- authors
`-- categories

BookEdition
|-- book
|-- ISBN when available
|-- publisher
|-- edition label
|-- publication year
|-- language
`-- cover metadata
```

`Book` represents the conceptual work. `BookEdition` represents a published edition that buyers need to identify precisely.

### 7.2 Physical inventory and listings

```text
Listing
|-- owner
|-- mode: SALE | DONATION | LOAN
|-- status
|-- city and area
|-- asking price for SALE
|-- negotiable flag
|-- description
|-- timestamps
`-- ListingItem[]
    |-- BookEdition
    |-- condition grade
    |-- condition notes
    `-- photographs
```

A listing can advertise one book or a bundle. Each listing item represents one physical copy offered by the owner; multiple copies use multiple items so condition and photographs remain unambiguous. Donation uses no price. The first lending workflow is free lending.

### 7.3 School book sets

```text
Institution
`-- Campus (optional)

SchoolBookSet
|-- institution
|-- optional campus
|-- curriculum or board
|-- grade
|-- academic year
`-- SchoolBookSetItem[]
    `-- required BookEdition
```

Campus remains optional because some sets are institution-wide, curriculum-wide, or board-wide. School book sets describe requirements rather than owned inventory. The discovery module compares available listing items with required editions to calculate complete and partial matches.

### 7.4 Marketplace interactions

```text
WantedRequest
|-- requester
|-- desired edition or school set
|-- acceptable location
|-- optional price limit
`-- active status

Exchange
|-- listing
|-- interested user
|-- lifecycle state
|-- timestamps
`-- audit events

Loan
|-- exchange
|-- agreed due date
|-- handover state
|-- return state
`-- lifecycle events
```

The system will record marketplace progress but will not initially collect or hold money.

## 8. NestJS module boundaries

- **IdentityModule:** accounts, credentials, sessions, roles, and user profiles.
- **CatalogModule:** works, authors, editions, ISBNs, publishers, and categories.
- **ListingsModule:** listings, listing items, modes, conditions, prices, and availability.
- **MediaModule:** upload authorization, file metadata, object keys, and signed access.
- **DiscoveryModule:** public browsing, search, structured filters, and match ranking.
- **RequestsModule:** wanted requests and matches.
- **ExchangesModule:** enquiries, reservations, handovers, completion, and cancellation.
- **LoansModule:** loan approval, due dates, return lifecycle, and overdue status.
- **SchoolsModule:** institutions, campuses, grades, academic years, and required sets.
- **NotificationsModule:** templates, delivery requests, preferences, and delivery history.
- **ModerationModule:** reports, listing decisions, suspensions, and audit trails.
- **HealthModule:** liveness, readiness, and dependency health.
- **IntelligenceModule:** submission and consumption of Python processing jobs.

Cross-module operations use exported application services. Database transactions that span modules are coordinated by a dedicated use-case service rather than hidden controller logic.

## 9. Workflows and state transitions

### 9.1 Sale and donation

```text
DRAFT -> PUBLISHED -> RESERVED -> COMPLETED
                     |             
                     `-> PUBLISHED  # reservation cancelled

DRAFT or PUBLISHED -> WITHDRAWN
PUBLISHED -> EXPIRED
```

Only the owner can publish or withdraw a listing. Only an authorized participant can act on an exchange. Completion is recorded explicitly so marketplace outcomes can be measured.

### 9.2 Free lending

```text
REQUESTED -> APPROVED -> HANDED_OVER -> RETURNED
     |          |             |
     v          v             v
 DECLINED   CANCELLED       OVERDUE -> RETURNED
```

The agreed due date is fixed when a request is approved. Paid rent, deposits, financial penalties, shipping returns, and automatic charges are not included.

### 9.3 Wanted request

```text
ACTIVE -> MATCHED -> FULFILLED
   |          |
   `-> CLOSED `-> ACTIVE  # rejected or stale match
```

Matching must be repeatable and idempotent. Reprocessing the same catalogue or listing change must not create duplicate notifications.

## 10. API and error design

- Version public endpoints under `/api/v1`.
- Use resource-oriented REST URLs and HTTP methods.
- Generate OpenAPI from controller and DTO metadata.
- Return a consistent error envelope containing a stable machine code, human-readable message, HTTP status, and optional field errors.
- Distinguish authentication failure, authorization failure, missing resources, validation failure, conflict, and unexpected failure.
- Do not expose stack traces, SQL errors, secrets, or internal object-storage paths.
- Attach a request identifier to logs and error responses.
- Make retry-sensitive write operations idempotent where duplicate submission is plausible.

## 11. Frontend design principles

- Public catalogue and listing pages prioritize fast discovery and indexable metadata.
- Interactive workflows use Client Components only where browser state is required.
- Loading, empty, error, and unauthorized states are deliberate product states.
- Forms explain validation errors at the relevant field and preserve safe user input after recoverable failures.
- Mobile-width behavior is required because shared marketplace links will commonly open on phones.
- Accessibility is part of acceptance: semantic controls, keyboard navigation, labels, focus behavior, and sufficient contrast.
- Search results clearly distinguish sale, donation, and loan listings.

Detailed visual design will be created during the version that first introduces each workflow.

## 12. Testing strategy

Use the smallest test level that verifies the behavior reliably:

- **Unit tests:** pure domain rules, state transitions, match scoring, and utility functions.
- **Backend integration tests:** NestJS request pipeline, validation, authorization, persistence, and transactions against an isolated test database.
- **Frontend component tests:** interactive forms and client-only behavior.
- **End-to-end tests:** a few critical journeys such as account creation, listing publication, discovery, reservation, and completion.
- **Contract verification:** generation and validation of OpenAPI plus successful compilation of the generated client.

Every database schema change includes a migration. Tests must not depend on execution order or manually retained local data.

The continuous-integration quality gate runs formatting checks, linting, TypeScript type-checking, tests, and production builds for affected applications.

## 13. Learning workflow

Each five-hour week targets this distribution:

| Activity | Target time |
|---|---:|
| Concept lesson and design reasoning | 45 minutes |
| Manual implementation | 2 hours |
| Tests and evidence-based debugging | 1 hour |
| Refactoring and review | 45 minutes |
| Documentation and commit | 30 minutes |

For each implementation task, guidance will include:

1. Purpose and user-visible outcome.
2. The concepts being learned.
3. Exact files to create or edit.
4. Commands or small scripts to run.
5. Small code sections to enter manually.
6. Explanation of important behavior.
7. Expected failing and passing output.
8. A verification exercise.
9. Common mistakes.
10. A comprehension checkpoint.

The development loop is:

```text
understand -> model -> failing test -> minimal implementation
-> passing test -> refactor -> document -> commit -> demonstrate
```

## 14. Version roadmap

### V0 - Foundation, 3 weeks

Deliver a working vertical connection from Next.js to a documented NestJS endpoint, with local PostgreSQL and continuous integration available.

Learning focus: pnpm workspaces, strict TypeScript, generated project structures, Docker Compose, environment validation, NestJS request lifecycle, OpenAPI, application-to-application HTTP, and CI.

### V1 - Book catalogue, 4 weeks

Allow visitors to browse and search manually seeded books and editions.

Learning focus: domain modelling, NestJS modules, DTOs, Prisma schema and migrations, relational constraints, pagination, structured filtering, Next.js routing, Server Components, and integration testing.

### V2 - Accounts and listings, 5 weeks

Allow a registered user to create, edit, publish, and withdraw a sale or donation listing with physical-book photographs.

Learning focus: authentication, session security, guards, resource ownership, form handling, object storage, file validation, and protected workflows.

### V3 - Marketplace MVP, 5 weeks

Allow visitors to discover listings and authenticated users to enquire, reserve, cancel, complete, or report an exchange.

Learning focus: state machines, concurrency, transactions, authorization, error UX, moderation foundations, and critical end-to-end tests.

V3 is the first deployable product-validation MVP.

### V4 - Wanted requests, 4 weeks

Allow users to save unmet demand and receive a single notification when a matching listing becomes available.

Learning focus: matching queries, scheduled or queued work, idempotency, notification boundaries, and delivery history.

### V5 - Free lending, 5 weeks

Allow owners to approve loan requests, agree on due dates, record handover, identify overdue loans, and confirm return.

Learning focus: time-dependent workflows, domain events, audit history, concurrent updates, and privacy-sensitive participant views.

### V6 - School book sets, 6 weeks

Allow catalogue maintainers to define institution, optional campus, curriculum, grade, academic year, and required editions. Allow users to discover available complete and partial matches.

Learning focus: richer relational models, bundle matching, relevance scoring, admin workflows, data quality, and explainable match results.

### V7 - Python book intelligence, 6 weeks

Allow a user to submit a supported book image or school book-list document and receive candidate ISBN/title/edition metadata for confirmation.

Learning focus: FastAPI, Pydantic, pytest, OCR/barcode processing, asynchronous service integration, retries, confidence scores, and untrusted-result handling.

### V8 - Production and portfolio, 5 weeks

Run a public beta with production monitoring, security review, operational documentation, performance measurements, and a polished technical case study.

Learning focus: deployment, CI/CD, logging, traces, alerts, backups, migrations in production, load testing, threat review, and technical communication.

The roadmap consumes approximately 43 focused weeks, or 215 planned hours. A 10-12 month calendar leaves limited buffer for interruptions, corrections, difficult concepts, and MVP feedback. If the actual pace is slower, quality and comprehension take priority over the calendar.

## 15. Version planning and acceptance

The master roadmap is stable direction, not a year-long task script. Each version receives its own design and detailed implementation plan immediately before development. That plan contains exact files, tests, commands, expected output, and commit checkpoints.

A version is complete only when:

- Its stated user outcome works through the intended interface.
- Relevant automated tests pass.
- Strict type-checking and linting pass.
- Authorization and invalid-input behavior are verified.
- Database changes have committed migrations.
- OpenAPI reflects public API behavior.
- The README or version documentation explains how to run and demonstrate it.
- Important trade-offs have an Architecture Decision Record.
- A version retrospective records what was learned and what should change next.

## 16. Portfolio deliverables

The repository will accumulate:

- Product and development README files.
- Architecture and data-flow diagrams.
- Entity-relationship diagrams.
- OpenAPI documentation and generated client.
- Database migrations and seed data.
- Unit, integration, and end-to-end tests.
- Continuous-integration configuration.
- Architecture Decision Records.
- Security and threat-review notes.
- Performance measurements and query-plan examples.
- Deployment and rollback documentation.
- Versioned changelog.
- A public demonstration environment after MVP readiness.
- A concise technical case study describing requirements, trade-offs, mistakes, corrections, and measured outcomes.

## 17. Principal risks and controls

| Risk | Control |
|---|---|
| Five hours per week produces context switching | End every session with a short written next step and keep weekly tasks small |
| Infrastructure displaces product learning | Add infrastructure only when a version has an explicit requirement |
| Marketplace scope expands continuously | Protect version boundaries and move new ideas to later version designs |
| Framework usage becomes mechanical | Require concept explanations, checkpoint questions, and ADRs for meaningful choices |
| Generated code hides understanding | Enter code manually, inspect CLI output, and avoid unexplained bulk generation |
| School catalogue becomes inaccurate | Store academic year and edition identity, retain source metadata, and require moderated changes |
| Minors or personal information create safety concerns | Design for adult/guardian accounts, minimize exposed data, and review safety before public launch |
| Lending becomes a financial rental system | Keep V5 free and exclude deposits, penalties, and payments |
| Python becomes artificial portfolio decoration | Add it only for an implemented OCR/barcode workflow with measured usefulness |
| Direct exchanges make completion hard to measure | Include explicit completion and cancellation states plus privacy-respecting follow-up |

## 18. Explicit non-goals for the planned roadmap

- Native iOS or Android applications.
- Paid rental, deposits, penalties, escrow, or platform wallets.
- Courier or COD integration.
- Real-time user chat.
- Microservices for each business module.
- Kafka, RabbitMQ, Kubernetes, or external search clusters.
- Generative-AI features without a validated user problem.
- Automatic catalogue mutation from OCR results.
- Nationwide operational claims before real local usage exists.

## 19. Next planning action

After this master design is reviewed, create the detailed V0 implementation plan. The V0 plan will cover three weekly milestones:

1. Workspace, repository conventions, strict TypeScript, NestJS, and Next.js scaffolding.
2. PostgreSQL, environment validation, health/readiness behavior, OpenAPI, and backend tests.
3. Frontend-to-API integration, generated-client boundary, continuous integration, documentation, and the first demonstration.

No V1 implementation plan will be written until V0 is complete and its retrospective has been reviewed.
