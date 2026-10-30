# Clingo Platform

Własne zlecenia wielosesyjne: formularz, wybór dodatków z Figmy, planowanie sesji i atomowy zapis są opisane w [dokumentacji](docs/wlasne-zlecenia-wielosesyjne.md). Weryfikacja: `npm run test:manual-projects` oraz `npm run verify:manual-projects`. Przed uruchomieniem na istniejącej bazie zastosuj `apps/api/src/database/migrations/20261030-manual-projects.sql` po migracjach R06/R07.

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

Internal navigation uses Next links and streaming loading states. The legacy homepage initializes and cleans up its controls on every client-side return. Provider images, add-on icons and homepage illustrations use responsive Next image optimization. The public catalogue is read without caching so publication and withdrawal appear on the next visit; orders, availability and confirmation remain uncached and session-checked. Quote/confirmation still verify current prices. Account lookups are deduplicated for 30 seconds in browser memory only and cleared after edits/logout. Settings and checkout fetch independent data concurrently. Optional Redis commands have a 200 ms deadline and skip disconnected cache clients; database fallback connections use a bounded reusable pool.

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

The provider application has its own authenticated session, employee schedules, scoped clients/settings/service drafts and manual jobs. Customer reservations from explicitly linked public profiles now appear alongside manual jobs in the orders list, month/week/day calendar, history and analytics. Each multi-session reservation appears as its individual sessions. Details include the saved customer contact, address, quote, invoice details and notes. Provider cancellation/completion updates the original customer order; customer cancellation/rescheduling is reflected in the provider panel. Lists refresh every 15 seconds and on focus. Public slots also exclude scheduled manual work and reservations on other profiles linked to the same account; this conservatively treats the organisation as one concurrent booking, without assigning public reservations to employees. Publishing service drafts is connected to the public catalogue (see below). Geocoding, notification delivery and employee-capacity booking remain separate work.

Apply `apps/api/src/database/migrations/20261017-customer-provider-bookings.sql` after the existing provider migrations when synchronization is disabled. It adds nullable `provider_profiles.account_id` and an order revision; it does not assign any existing profiles automatically. After verifying ownership, an administrator can inspect IDs with `node scripts/link-provider-profile.cjs --list` and link a profile with `node scripts/link-provider-profile.cjs --profile PUBLIC_PROFILE_ID --account VERIFIED_ACCOUNT_UUID`. The command refuses reassignment to a different account. Profile links are visible in provider settings. The public API cannot claim existing profiles.

The customer site's “Dla Wykonawców” menu opens the provider application through `/dla-wykonawcow`. Set server-side `PROVIDER_URL` on the customer app and `NEXT_PUBLIC_CUSTOMER_URL` on the provider app for deployment; local defaults use ports 3001 and 3000. Client and provider sessions remain separate.

With the local API/database running, `npm run verify:booking-bridge` checks the customer-to-provider flow, ownership, shared availability, concurrent manual/customer creation, cancellation, completion, rescheduling and multi-session totals. It creates and removes only its own uniquely named fixtures.

See [provider team setup and verification](docs/provider-team-live.md) for the additive database migrations, account setup, tests and remaining scope. Team schedules are not yet connected to customer booking availability. Run `npm run test:provider-team` for the provider service/proxy tests.

## Publishing provider services

In the provider panel, open **Twoje usługi → Szkice**, complete the description and configuration, accept the service standard, and choose **Opublikuj**. The organisation must have a city saved in location settings. Publication atomically creates a public offer and catalogue entry with a stable `service-<offer UUID>` ID, already linked to the publishing account. Existing catalogue profiles retain their verified ownership links; publishing never claims them. New offers are not marked verified.

The public offer uses the saved per-square-metre rate, duration per 100 m², add-ons (piece or 30 minutes), frequency discount, lead time and booking buffer. Pricing supports areas with up to two decimals; durations round up to 15 minutes. Published offers retain their full configured area range. For account-owned offers, service-qualified employees' weekly shifts determine working hours and the maximum continuous session for each crew size (at most 12 hours). Availability and automatic assignments respect shifts, absences, public reservations, manual jobs and the greater applicable booking buffer. Different employees may serve concurrent orders; sessions of one project remain sequential. The planner fills free windows, respects customer availability, and regenerates the entire schedule when the customer excludes a date. Projects use the one-off price; recurring selection for a single visit applies the displayed discount to this reservation, with subsequent visits requiring separate bookings. Coverage is the saved city, with travel included. Radius-based coverage, per-kilometre travel charges, photo uploads and automatic recurring bookings are not implemented; the editor explains these limits.

**Zapisz i opublikuj zmiany** updates the public offer. **Wycofaj do szkicu** and archiving hide it and reject new checkout requests; existing orders, cancellation/completion and history remain accessible. Existing reservations keep their saved prices and contacts. Name and city edits in organisation settings update generated public offers in the same transaction. Catalogue pages are uncached, including the database fallback, so new visits see publication and withdrawal immediately.

With schema synchronization disabled, apply `apps/api/src/database/migrations/20261023-provider-publication.sql` after the booking bridge migration. It only adds `published` (defaults to true for existing profiles) and nullable `area_pricing`; it does not publish any saved provider drafts. Local development synchronization applies the same columns automatically.

R01 staffing estimates: publication includes the offer's staffing tiers. The public estimate divides the single-worker workload by the selected tier's worker count, then rounds up to the existing 15-minute calendar interval. Fractional areas retain their exact price/workload and round up to a whole square metre only when selecting the tier. Prices and extra-service durations keep their existing rules. New reservations retain their estimated worker count and booked duration even if the offer later changes; this estimate does not assign actual employees (R03).

Apply `apps/api/src/database/migrations/20261026-offer-staffing-estimate.sql` and then `apps/api/src/database/migrations/20261026-multi-session-publication.sql` to existing databases, including development databases with synchronization enabled. These idempotent migrations attach saved staffing tiers and restore configured area limits on profiles generated from the same account's offers; they do not change existing orders, draft publication status, prices or appointment dates. Older independent area profiles without tiers retain the single-worker calculation.

For a local end-to-end check, start PostgreSQL/API and production web/provider apps on ports 55432/4000/3000/3001, then run `node scripts/verify-multi-session-booking.cjs`. It uses Playwright from the bundled Codex runtime and creates and removes only its own temporary accounts, offers and orders. `node scripts/verify-publication.cjs` independently checks publication, backfills, booking persistence and provider visibility against the real API/database.

R03/R05 require the existing `apps/api/src/database/migrations/20261025-provider-absences.sql` on every database, including installations using schema synchronization. New assignment snapshots are stored in `orders.selected_options`; no reassignment of historical orders is performed. Configure actual employees, service categories and enabled shifts before accepting bookings on an account-owned offer. An account with no available employees has no reservable slots. Old account-owned reservations/manual jobs without an assignment conservatively block the entire team until the provider assigns or reschedules them; independent legacy catalogue profiles keep their previous calendar model. Providers can edit each public booking session's crew, with at least one person and explicit acknowledgement when reducing the original estimate. Absence creation/cancellation, employee changes and booking writes acquire the same account lock.

Run `node scripts/verify-staffing.cjs` against the local API/PostgreSQL for real concurrent capacity, ownership, staffing edits, absences, rescheduling, early shifts and multi-session persistence checks. The browser verification also changes a session's employee and saves an absence through the provider UI.

R04 adds `settings/staffing`: solo work or team work, an optional declared team size and a revision. Apply `apps/api/src/database/migrations/20261027-provider-staffing-limit.sql` before starting this version on every database, including environments using synchronization. Existing accounts default to team mode with an automatic roster-based limit. Solo mode caps every tier and the employee list at one person. Team tiers cannot exceed the declaration, actual roster size or the existing 50-person system maximum. New empty accounts can prepare one-person drafts; publication requires an employee record. Explicit excessive configurations are rejected, and reducing the roster is blocked until conflicting current offers are corrected or withdrawn. Archived configurations and historical booking snapshots are preserved. Invalid legacy profiles are excluded from public API and fallback catalogue reads until corrected. Run `npm run verify:staffing-limit` with API/web/provider running for the local database and browser check. See `docs/r04-limit-obsady-2026-10-27.md`.

Run `npm run verify:publication` with the API/database running. It creates and removes isolated fixtures and verifies publication requirements, rollback, exact area pricing, account isolation, settings propagation, checkout-to-provider orders, price snapshots, double-booking prevention, withdrawal, cancellation, republication and concurrent revisions.

R06 adds a shared project editor for public bookings and legacy multi-session proposals, with multiple employees per session, area-based workload snapshots, required/planned/remaining/excess work and explicit acknowledgement of shortages or excess. Future sessions can be added, removed and rescheduled; started sessions only allow an end-time change, and elapsed sessions remain immutable. Project saves check actual employee availability and the whole project's revision. Stable session IDs preserve links when other sessions are removed. The agreed total price is preserved; early project completion, notification delivery and financial settlement remain separate R07–R09 work.

After the earlier migrations and `npm run build:api`, run `node scripts/migrate-project-estimates.cjs` before starting the new API, including synchronization-enabled environments. It transactionally applies `apps/api/src/database/migrations/20261027-project-editor.sql`, backs up the affected data under `tmp/backups/`, freezes historical workload bases and backfills stable session IDs and legacy employee snapshots. Historical bases are labeled in the UI and are not recalculated from today's service configuration. Run `npm run test:projects` for project rules and `npm run verify:projects` with local PostgreSQL/API/provider running for the real database/browser check and migration fixtures. See [the R06 report](docs/r06-edytor-projektu-2026-10-27.md).

R07 adds explicitly confirmed whole-project completion before the last appointment. It marks the root public/manual project completed and releases future sessions atomically, preserving the planned dates, crew and agreed price as history. Released sessions are labeled in provider/customer details and excluded from cancellation/work analytics. Completed projects cannot be rescheduled, edited or reopened through the old session form. Standalone one-session reservations retain their previous completion rule. After the R06 migration, run `node scripts/migrate-project-completion.cjs` before starting this version on each database; it adds `completed` to the legacy project status constraint without changing existing project data. Run `npm run verify:project-completion` with local PostgreSQL/API/web/provider for real database/browser checks. See [the R07 report](docs/r07-zakonczenie-projektu-2026-10-27.md). Notification delivery and financial settlement remain separate R08/R09 work.

R12 connects verified customer reviews to the provider review list and sidebar without copying live reviews into legacy storage. Linked companies share their rating across offers, public profiles, catalogue cards, favorites and PostgreSQL fallbacks. Existing separate provider reviews are retained; catalogue seed counts are not added to a linked company's real votes. Customer edits/deletions update all views, including photos. Customer-review reports require an owner/admin, current version and update timestamp; reporting does not hide or remove a rating. Before starting the new API on each database, run `node scripts/migrate-review-bridge.cjs` to add the report/version fields, with a backup and preservation checks. Run `npm run test:review-bridge` and `npm run verify:review-bridge` for rule/security and real database/browser verification. See [the R12 report](docs/r12-opinie-i-oceny.md).
