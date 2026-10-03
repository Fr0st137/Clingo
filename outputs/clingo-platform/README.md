# Clingo Platform

Figma import implemented as a Next.js + Tailwind CSS frontend with a NestJS backend scaffold for PostgreSQL/PostGIS and Redis.

## Apps

- `apps/web`: Next.js React UI matching the inspected Figma orders dashboard.
- `apps/provider`: Next.js provider panel, imported screen-by-screen from the provider Figma project.
- `apps/api`: NestJS API with dashboard data, TypeORM/PostGIS configuration, and Redis cache wiring.

## Run

```bash
npm install
npm run dev:web
npm run dev:provider
npm run dev:api
```

Optional local services:

```bash
docker compose up -d
```

PostgreSQL/PostGIS and Redis use `restart: unless-stopped`, so Docker Desktop starts them again after its engine restarts. The root `start-clingo-provider.bat` launcher also starts Docker Desktop when needed, brings up both containers, waits for PostgreSQL, starts the API and only then opens the provider panel.

## Fast local preview

The root `start-clingo-platform.bat` now builds the website once before opening the optimized production preview. The longer startup replaces on-demand page compilation. Re-run it after code changes. `start-clingo-development.bat` (or `npm run dev:web`) keeps automatic updates and uses Turbopack; its first page visit can still include compilation.

With the API already running, use `npm run preview:web`, or `npm run build:web` followed by `npm run start:web -- -p 3001` if port 3000 is occupied. Production output is isolated in `.next-production`, so a build does not overwrite the development server's `.next` files.

Internal navigation uses Next links and streaming loading states. The legacy homepage initializes and cleans up its controls on every client-side return. Provider images, add-on icons and homepage illustrations use responsive Next image optimization. Only the public catalogue is cached for 30 seconds; orders, availability and confirmation remain uncached and session-checked. Quote/confirmation still verify current prices. Account lookups are deduplicated for 30 seconds in browser memory only and cleared after edits/logout. Settings and checkout fetch independent data concurrently. Optional Redis commands have a 200 ms deadline and skip disconnected cache clients; database fallback connections use a bounded reusable pool.

The provider search in the public header suggests matching profiles by person or company name and opens the selected public provider profile. Matching is case-insensitive, accepts Polish names typed without diacritics, and supports multiple name fragments in any order.

## Customer reservations

The current single-visit checkout is connected to PostgreSQL: offer selection, available date/time, address/contact/invoice details, notes, server-calculated summary, confirmation, and the customer's reservations list. Drafts survive refresh/back navigation in the same browser tab. A server-issued session is required; users of the old preview must sign in again. Registration currently creates a local account directly; email verification is not implemented and no activation message is claimed.

Availability uses the provider's existing reservations and optional `provider_profiles.booking_settings` JSON (`days`: Sunday=0, `startHour`, `endHour`, `bufferMinutes`, `leadHours`). Without configuration the development default is Monday–Saturday, 08:00–20:00, one simultaneous reservation per provider. Times are interpreted in Europe/Warsaw, in 15-minute start intervals, up to six months ahead. The complete service must fit within working hours. Employee schedules and multi-session planning are not implemented yet. Frequency selection stores the chosen preference/discount for this visit; it does not automatically book subsequent visits.

The confirmation endpoint rechecks availability inside a transaction that locks the provider, rejects changed prices, stores an immutable quote/contact snapshot, and deduplicates retries using the draft request ID. Reading, creating, cancelling and rescheduling orders derives account ownership from the session, not a supplied email. Profile, settings, favorites and customer-review endpoints now also enforce session ownership. The legacy chat remains demo functionality and is not a private messaging implementation.

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

## Account settings, favorites and reviews

The customer account now persists personal/contact details, address and email/SMS preferences in PostgreSQL. The email address is read-only until verified email changes are implemented. Saving notification preferences does not send messages: SMTP/SMS integrations and OAuth account connections remain unavailable, explicitly labeled in settings. Forgotten-password recovery and account activation are separate, unfinished email/SMS flows.

Password changes require the current password and matching new passwords (15–128 characters). New passwords are not trimmed. Only salted, versioned scrypt hashes are stored (`N=131072, r=8, p=1`, 32-byte derived key, independent 16-byte random salt); raw passwords and session tokens are not stored in the database. Legacy scrypt hashes are upgraded on successful login. Password rotation locks the account, updates the hash and invalidates all previous sessions in one transaction; the current browser receives a new HttpOnly cookie. Logout revokes its server session. Authentication and review-write rate limits are atomic PostgreSQL counters, shared across server instances, with expired buckets cleaned periodically. Password derivations are asynchronous with a bounded concurrency of two per process.

These choices follow [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). They are not a substitute for a production security review. Before deployment, configure HTTPS, restricted API/database access, secrets, backups, monitoring and edge rate limits. The API's IP limits intentionally do not trust arbitrary forwarded headers; requests from the Next proxy share a source-IP bucket, in addition to independent account buckets. Configure a trusted deployment proxy/edge limiter for production traffic volumes. Local Compose database/cache ports are bound to 127.0.0.1.

Favorites have a composite account/provider key, persist across devices and synchronize the list and profile buttons. Legacy seeded favorites are not assigned to any customer. Private account pages never fall back to unscoped demo data when the API fails.

Reviews belong to a specific account and completed reservation, with one review per reservation enforced by the database. Merely reaching the reservation's end time is insufficient; the service must have an explicit completed status. Existing provider/admin completion workflow remains outside this change. Customers can add/edit/delete their own rating, text and up to three photos; other accounts cannot mutate or attach their photos. Reviews appear publicly on provider/offer pages with first name and last initial. Public aggregate ratings include existing catalogue ratings plus real customer reviews. Demo reviews are not assigned to customers.

Photos accept JPG, PNG and WebP up to 2 MB / 16 megapixels each, are decoded and re-encoded using sharp as WebP up to 1600px, and are stored in PostgreSQL with the review. The conversion strips metadata, including EXIF location. File names and client-supplied URLs are not trusted. Removing a photo/review removes its stored image data; image responses use `nosniff` and `no-store`. Authors are told before saving that reviews and photos will be public.

### Schema and validation

Development `TYPEORM_SYNC=true` adds `users.notification_preferences`, `auth_rate_limits`, `customer_favorites`, `customer_reviews` and `customer_review_images`. For environments without synchronization, apply `apps/api/src/database/migrations/20260831-customer-account.sql` before starting the new API. It is additive and does not rewrite existing user passwords, orders or demo data. Back up the database first; keep synchronization disabled in production.

The security dependency update uses Next 15.5.24, Nest 11.2.3, TypeORM 0.3.31 and sharp 0.35.4. Root dependency overrides keep PostCSS, lodash and multer on patched versions. Use Node 22 or newer and install from the committed lockfile. The final dependency resolution reported zero known vulnerabilities on 2026-08-31; rerun the audit regularly as advisories change.

With the local API/database running:

```bash
npm run verify:account
node scripts/verify-account-web.cjs
node scripts/verify-account-migration.cjs
npm run verify:booking
npm run test:booking
npm run test:offer-request
npm run test:order-api
```

The web check additionally requires the frontend on port 3000 (`CLINGO_TEST_WEB` can override it). Checks create isolated disposable accounts/provider/orders and remove only their fixtures. They verify persistence, ownership, malformed input, password migration/rotation, revoked sessions, durable limits, concurrent uniqueness, photo validation/metadata removal, public review rendering and cookie/CSRF behavior. `browser-account-fixture.cjs setup/check/cleanup` supports an optional local browser smoke check.

## Provider team, clients and settings

The provider application now has its own authenticated session and API-backed employee list, add/edit/delete forms and recurring weekly work schedules. Day/week views, real hour totals, employee filters and CSV export use saved employee records. The client directory supports scoped contacts, addresses and notes with search and versioned edits. Company settings, notification preferences and password changes use authenticated API endpoints; a scoped JSON export is available. Service drafts support prices, duration, search, edits, archive and restore, and location settings save the service address and travel radius. Manual jobs connect saved clients, services and employees in a shared month/week/day calendar, list and history. Job snapshots preserve customer contact, address and service details, while an account lock prevents overlapping jobs for one employee. Publishing drafts, geocoding/search coverage, notification delivery and linking customer reservations to provider jobs remain future work. The remaining provider screens are explicitly marked as previews.

See [provider team setup and verification](docs/provider-team-live.md) for the additive database migrations, account setup, tests and remaining scope. Team schedules are not yet connected to customer booking availability. Run `npm run test:provider-team` for the provider service/proxy tests.
