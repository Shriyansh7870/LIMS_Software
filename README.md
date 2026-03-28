# Quantum Kairoz

Pharmaceutical quality and lab intelligence platform for Forge Quantum Solutions.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite 5 · Tailwind CSS 3 · TanStack Query v5 · Recharts · Framer Motion |
| Backend | Node.js · Express 4 · Prisma ORM 5 · TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | JWT (access + refresh tokens) · RBAC (5 roles) |
| Infra | Docker Compose · GitHub Actions CI/CD |

## Quick Start

### Prerequisites

- Docker Desktop
- Node.js 20+ (for local dev without Docker)

### With Docker (recommended)

```bash
cd quantum-kairoz
docker compose up --build
```

Services start at:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Without Docker

**1. Start PostgreSQL and Redis** (or use existing instances)

**2. Backend**

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and REDIS_URL

npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@kairoz.com | Admin@123 |
| QA Director | qa.director@kairoz.com | QA@123456 |
| Lab Head | lab.head@kairoz.com | Lab@12345 |
| QC Analyst | analyst@kairoz.com | QC@123456 |
| Partner | partner@kairoz.com | Part@1234 |

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `PORT` | API server port | `3001` |
| `FRONTEND_URL` | CORS origin | `http://localhost:5173` |
| `AWS_ACCESS_KEY_ID` | S3 uploads (optional) | — |
| `AWS_SECRET_ACCESS_KEY` | S3 uploads (optional) | — |
| `AWS_BUCKET_NAME` | S3 bucket (optional) | — |

## Architecture

```
quantum-kairoz/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 20+ table schema
│   │   └── seed.ts              # 12 months of seed data
│   ├── src/
│   │   ├── config/              # DB, Redis, env config
│   │   ├── controllers/         # 17 domain controllers
│   │   ├── middleware/          # auth, errorHandler
│   │   ├── routes/              # Express routers
│   │   ├── jobs/                # node-cron scheduled jobs
│   │   └── server.ts            # Express app entry
│   └── tests/
│       └── integration/         # Supertest integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Layout
│   │   │   └── ui/              # 15+ shared components
│   │   ├── context/             # Auth, Notification contexts
│   │   ├── lib/                 # Axios instance
│   │   └── pages/               # 15 page components
│   └── nginx.conf               # Production nginx config
├── .github/workflows/ci.yml     # GitHub Actions CI
└── docker-compose.yml
```

## Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | KPIs, trends, partner map |
| Lab Registry | `/registry` | All labs with drawer detail |
| Equipment | `/equipment` | Equipment tracking, utilisation matrix |
| Certifications | `/certifications` | Cert health, expiry timeline |
| Partners | `/partners` | Partner scorecard, radar chart |
| Lab Finder | `/finder` | Scored lab matching |
| CAPA | `/capa` | Deviations, root cause, trend charts |
| Audits | `/audits` | Score trend, calendar heatmap |
| SOPs | `/sop` | Version control, due-for-review alerts |
| Batch Records | `/bmr` | Yield trend, monthly output |
| Documents | `/dms` | Document management, download |
| Test Requests | `/requests` | Volume trend, by-lab breakdown |
| Workflows | `/workflows` | Approval engine, step advancement |
| Integrations | `/integrations` | ERP/LIMS/QMS connectors |
| Onboard Partner | `/onboard` | 5-step onboarding wizard |

## API Endpoints

Full Swagger docs at `/api/docs` when running.

Base path: `/api/v1`

Key endpoints:
- `POST /auth/login` — JWT login
- `GET /dashboard/kpis` — KPI summary (Redis 60s)
- `GET /labs` — Lab registry with filters
- `GET /partners/finder` — Scored lab matching
- `POST /capa` — Create CAPA (auto-triggers WF-001)
- `POST /requests` — Create test request (auto-triggers WF-005 if >₹50k)
- `PUT /workflows/workflow-runs/:id/steps/:stepId` — Approve/reject workflow step
- `GET /search?q=` — Global search across 7 entity types

## Seed Data

The seed script generates 12 months of data (Mar 2025 – Mar 2026):
- 5 users across all roles
- 8 labs (4 internal + 4 external partner labs)
- 15 equipment items with utilisation records
- 14 certifications with varying expiry dates
- ~120 CAPA records with monthly trend
- 12 monthly audit records per lab
- 18 SOPs with version history
- Weekly batch records with 94–98.5% yields
- 25 documents
- Monthly test requests with quote amounts
- 6 integration records
- 5 workflow templates (WF-001 to WF-005)

## Testing

```bash
# Backend integration tests
cd backend && npm test

# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend build verification
cd frontend && npm run build
```

## CI/CD

GitHub Actions runs on push to `main`/`develop`:
1. **Backend**: lint → type-check → migrate → test
2. **Frontend**: lint → type-check → build
3. **Docker**: build production images (main branch only)

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `teal` | `#0D9488` | Primary brand, CTAs |
| `teal-light` | `#14B8A6` | Hover states |
| `teal-dark` | `#0F766E` | Active states |
| `sidebar` | `#071616` | Navigation background |
| `bg` | `#ECF2F2` | Page background |
| `risk-high` | `#DC2626` | Alerts, overdue |
| `risk-medium` | `#D97706` | Warnings |
| `risk-low` | `#16A34A` | Success states |

Fonts: **Syne** (headings) · **Instrument Sans** (body) · **DM Mono** (code/numbers)
