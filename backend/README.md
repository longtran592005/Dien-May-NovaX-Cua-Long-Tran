# Backend Microservices Skeleton

This folder contains the initial NestJS microservices skeleton:
- api-gateway
- auth-service
- catalog-service
- cart-service
- order-service
- payment-service
- ai-service

Each service exposes:
- GET /health

## Run locally
1. cd backend
2. npm install
3. npm run db:bootstrap
4. npm run dev:all

## Build
- npm run build

## Database: PostgreSQL migration flow
1. Create backend environment file and set PostgreSQL connection:
	- Copy `.env.example` to `.env`
	- Ensure `DATABASE_URL` points to PostgreSQL
2. Run a safety backup of old SQLite dev data (if present):
	- `npm run db:backup:sqlite`
3. Validate migration environment:
	- `npm run db:check:postgres-env`
4. Generate/apply PostgreSQL migration in dev:
	- `npm run prisma:migrate:pg`
5. Generate Prisma client and seed:
	- `npm run prisma:generate`
	- `npm run prisma:seed`
6. Check migration status:
	- `npm run prisma:status`

## Local demo bootstrap
- `npm run db:bootstrap` to seed demo users, categories, stores, and products before starting the services.

## Release and Cutover Docs
- Review gate checklist: `docs/review-gate-checklist.md`
- PostgreSQL cutover runbook: `docs/postgresql-cutover-runbook.md`
