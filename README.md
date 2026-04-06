# NovaX Commerce Platform

NovaX hien tai la frontend React + TypeScript. Tai lieu nay mo ta huong nang cap thanh he thong ban hang fullstack co AI, chay duoc tu local den Linux VPS, cloud va Kubernetes.

## Muc tieu

- Chuyen tu mock frontend sang e-commerce production-ready.
- Co backend microservices va duong su kien asynchonous.
- Co AI tu van san pham + semantic search.
- Trien khai duoc tren Linux server, cloud managed, va Kubernetes.

## Cong nghe de xuat (top-tier hien nay)

### Frontend

- React 18 + TypeScript + Vite
- TanStack Query (data fetching va cache)
- React Router
- Tailwind CSS + shadcn/ui
- Vitest + Playwright

### Backend

- Node.js 20 LTS
- NestJS (microservices + gateway)
- Prisma ORM
- PostgreSQL 16 (transactional data)
- Redis 7 (cache, session, rate limit support)
- RabbitMQ (event-driven MVP) hoac Kafka (scale lon)

### AI

- Embeddings + vector search (pgvector)
- Recommendation service (intent + metadata)
- LLM provider: OpenAI/Azure OpenAI (qua service abstraction)

### DevOps va ha tang

- Docker + Docker Compose
- Nginx (reverse proxy, TLS termination, static caching)
- GitHub Actions (CI/CD)
- Terraform (cloud IaC)
- Kubernetes + Helm (khi can scale)
- Observability: OpenTelemetry + Prometheus + Grafana + Sentry

## Trang thai hien tai

- Da co bo ignore an toan cho git/docker/nginx.
- Da co file mau bien moi truong `.env.example`.
- Da co Dockerfile va docker-compose co the build frontend SPA.
- Da co Nginx config cho SPA fallback va health endpoint.
- Da co skeleton backend NestJS cho 7 service trong thu muc `backend/`.
- Da co compose fullstack trong `infra/docker/docker-compose.fullstack.yml`.
- Da co API contract MVP trong `infra/openapi/novax-mvp.yaml`.
- Da co CI quality gate lint/test/build trong `.github/workflows/ci.yml`.

## Khoi dong local

### Cach 1: Chay dev nhu hien tai

```bash
npm install
npm run dev
```

### Cach 2: Chay container frontend

```bash
docker compose up --build
```

Ung dung se phuc vu qua cổng `3000`.

### Cach 3: Chay backend service mode

```bash
cd backend
npm install
npm run dev:gateway
```

Gateway chay tai cong `8080`.

### Khoi tao schema va seed du lieu backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Cach 4: Chay fullstack compose (frontend + microservices + DB + cache + queue)

```bash
docker compose -f infra/docker/docker-compose.fullstack.yml --env-file .env.example up --build
```

Khi chay fullstack:
- Edge ingress (frontend + API): `http://localhost:3000`
- API health qua edge proxy: `http://localhost:3000/api/v1/health`

### Kiem thu nhanh user-scoped cart

```bash
# User A
curl -X PUT http://localhost:3000/api/v1/cart -H "X-User-Id: guest_a" -H "Content-Type: application/json" -d '{"items":[{"productId":"p1","quantity":1}]}'

# User B
curl -X PUT http://localhost:3000/api/v1/cart -H "X-User-Id: guest_b" -H "Content-Type: application/json" -d '{"items":[{"productId":"p2","quantity":2}]}'
```

## Bien moi truong

- Sao chep `.env.example` thanh `.env` va thay gia tri secrets.
- Khong commit `.env` vao git.

## Lo trinh trien khai de xuat

1. Phase 1: hygiene + standards (ignore, env, CI).
2. Phase 2: dung skeleton microservices (gateway, auth, catalog, cart, order, payment, ai).
3. Phase 3: schema + migrations + event bus.
4. Phase 4: ket noi frontend sang API that.
5. Phase 5: them AI semantic search + recommendation.
6. Phase 6: production hardening (security, observability, backup, DR).

## Bao mat can co ngay

- Secrets management theo environment.
- CORS whitelist ro rang.
- Rate limit tai gateway.
- JWT access/refresh rotation.
- Input validation va sanitize.

## JWT auth da co

- Backend auth endpoints:
	- `POST /api/v1/auth/login`
	- `POST /api/v1/auth/refresh`
	- `GET /api/v1/auth/me`
	- `POST /api/v1/auth/logout`
- Frontend da dung bearer token cho cart/order APIs.
- `checkout` va `profile` da duoc protect route.
- Tai khoan demo: `user@email.com / 123456`

## Deploy Linux VPS tu dong

- Workflow deploy: `.github/workflows/deploy-vps.yml`
- Script zero-downtime restart: `scripts/deploy_zero_downtime.sh`

Can cau hinh GitHub Secrets:
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `VPS_DEPLOY_PATH`
- `VPS_PORT` (tuy chon)
- `VPS_PROJECT_NAME` (tuy chon)
- `VPS_COMPOSE_FILE` (tuy chon)
- `VPS_ENV_FILE` (tuy chon)
- `VPS_EDGE_PORT` (tuy chon)

## Buoc tiep theo

- Tao module dung nghiep vu dau tien cho auth/catalog trong backend.
- Noi API Gateway sang tung service qua HTTP/gRPC.
- Tao schema Prisma + migration dau tien cho users/products/orders.
