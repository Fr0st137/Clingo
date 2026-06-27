# Clingo Platform

Figma import implemented as a Next.js + Tailwind CSS frontend with a NestJS backend scaffold for PostgreSQL/PostGIS and Redis.

## Apps

- `apps/web`: Next.js React UI matching the inspected Figma orders dashboard.
- `apps/api`: NestJS API with dashboard data, TypeORM/PostGIS configuration, and Redis cache wiring.

## Run

```bash
npm install
npm run dev:web
npm run dev:api
```

Optional local services:

```bash
docker compose up -d
```
