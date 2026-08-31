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

## Fast local preview

The root `start-clingo-platform.bat` now builds the website once before opening the optimized production preview. The longer startup replaces on-demand page compilation. Re-run it after code changes. `start-clingo-development.bat` (or `npm run dev:web`) keeps automatic updates and uses Turbopack; its first page visit can still include compilation.

With the API already running, use `npm run preview:web`, or `npm run build:web` followed by `npm run start:web -- -p 3001` if port 3000 is occupied. Production output is isolated in `.next-production`, so a build does not overwrite the development server's `.next` files.

Internal navigation uses Next links and streaming loading states. The legacy homepage initializes and cleans up its controls on every client-side return. Provider images, add-on icons and homepage illustrations use responsive Next image optimization. Only the public catalogue is cached for 30 seconds; orders, availability and confirmation remain uncached and session-checked. Quote/confirmation still verify current prices. Account lookups are deduplicated for 30 seconds in browser memory only and cleared after edits/logout. Settings and checkout fetch independent data concurrently. Optional Redis commands have a 200 ms deadline and skip disconnected cache clients; database fallback connections use a bounded reusable pool.

## Customer reservations

The current single-visit checkout is connected to PostgreSQL: offer selection, available date/time, address/contact/invoice details, notes, server-calculated summary, confirmation, and the customer's reservations list. Drafts survive refresh/back navigation in the same browser tab. A server-issued session is required; users of the old preview must sign in again. Registration currently creates a local account directly; email verification is not implemented and no activation message is claimed.

Availability uses the provider's existing reservations and optional `provider_profiles.booking_settings` JSON (`days`: Sunday=0, `startHour`, `endHour`, `bufferMinutes`, `leadHours`). Without configuration the development default is Monday–Saturday, 08:00–20:00, one simultaneous reservation per provider. Times are interpreted in Europe/Warsaw, in 15-minute start intervals, up to six months ahead. The complete service must fit within working hours. Employee schedules and multi-session planning are not implemented yet. Frequency selection stores the chosen preference/discount for this visit; it does not automatically book subsequent visits.

The confirmation endpoint rechecks availability inside a transaction that locks the provider, rejects changed prices, stores an immutable quote/contact snapshot, and deduplicates retries using the draft request ID. Reading, creating, cancelling and rescheduling orders derives account ownership from the session, not a supplied email. This does not complete authentication/security work for unrelated legacy profile and dashboard endpoints.

No real SMS/email dispatch or online customer payment is performed. Confirmation only claims a successful database reservation. Existing standards/regulations pages still need their actual content before launch.

The offer profile shows the Figma missing-data and out-of-area summaries, disables checkout until both fields are valid, and preserves the request in its URL. Area choices currently come from the provider's existing fixed-price variants; arbitrary square-metre pricing remains separate work. Coverage uses the explicitly declared cities in the `location` metric labeled `Obsługiwany obszar`, not the provider's office address. Enter addresses as `City, street number` or `street number, postal-code City`. This is city-based validation, not geocoding or a kilometre-radius calculation. Missing coverage configuration blocks checkout. The reservation API rechecks coverage when saving, including addresses edited in the final form.

Local development uses `TYPEORM_SYNC=true` to add the `auth_sessions` table and the nullable `provider_profiles.booking_settings` column. Environments with synchronization disabled must apply equivalent additive schema migrations before running this version. Do not enable schema synchronization in production.

Verification (API and local PostgreSQL running for the second command):

```bash
npm run test:booking
npm run verify:booking
npm run test:offer-request
npm run test:order-api
npm run verify:navigation
```

The integration check uses isolated temporary accounts and a cloned test provider, and removes only its own fixtures. It covers persistence, ownership, invalid input, competing reservations, retries and freeing a cancelled slot.

`verify:navigation` checks thirteen public/account/checkout pages and reports complete HTML response times (not browser rendering times). It uses and removes its own local account. Set `CLINGO_TEST_WEB` to measure a preview on a different port. Compare cold and warm visits separately, and compare the same server mode when isolating code changes from development compilation overhead.
