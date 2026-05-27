# Farm Diary â€” Claude Context File
> This file is read automatically at the start of every session.  
> It tells Claude everything needed to continue work on this project without re-explaining from scratch.

---

## What This Project Is

**Farm Diary** (`farmdiary.al`) is a PWA (Progressive Web App) for Albanian farmers to digitally log and manage farm activities â€” replacing paper notebooks. Built in Albanian. Works offline. Free at MVP scale.

- **Owner:** Kevin (kevinzogu@gmail.com)
- **Stack:** Next.js 14 + TypeScript, Neon PostgreSQL, Drizzle ORM, **custom JWT auth** (bcryptjs + jose), IndexedDB/Dexie.js (offline), Web Push API, Cloudinary (photos), Vercel (hosting), Lucide React icons, next-intl (i18n)
- **Status:** ðŸŸ¢ Active development
- **Current phase:** Auth + dashboard + beekeeper module 100% done. Livestock module is next.
- **UI Skill:** `ui-ux-pro-max` installed at `.claude/skills/ui-ux-pro-max/` â€” style: **Organic Biophilic + Flat Design**, palette: Earth Green, Lucide SVG icons (no emojis as icons)

---

## Key Files

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file â€” auto-read every session |
| `FARM_DIARY_PROJECT.md` | Full living design document â€” deep context |
| `db/schema.ts` | Single source of truth for all 19 DB tables |
| `lib/auth/session.ts` | JWT create/get/delete (jose, `fd_session` cookie) |
| `middleware.ts` | Edge JWT guard â€” protects all non-public routes |
| `.env.local` | DATABASE_URL, AUTH_SECRET, VAPID keys, etc. |
| `design-system/ditari-i-fermes/MASTER.md` | Generated design system from ui-ux-pro-max skill |

---

## Current State

**Last session:** May 27, 2026 â€” Beekeeper module 100% complete (inspection edit/delete + archived hives toggle)

### âœ… Completed

**Infrastructure**
- Next.js 14 project fully set up (package.json, tsconfig, tailwind, next-intl, PWA manifest)
- Neon PostgreSQL connected via Drizzle ORM â€” all 19 tables pushed and live
- `drizzle.config.ts` at root with dotenv loading `.env.local`
- `next.config.mjs` (not `.ts` â€” Next.js 14 doesn't support `.ts` config)
- Albanian translations in `messages/sq.json`
- `lucide-react` installed, `ui-ux-pro-max` skill installed

**Database (Neon â€” fully synced)**
- All 19 original tables live
- `users.username` â€” added via `scripts/migrate-v3.mjs`
- `users.password_hash` â€” added via `scripts/migrate-auth.mjs`
- `farms.farm_type` â€” added via `scripts/migrate-v2.mjs` (uses existing `farm_section_type` enum)
- Migration scripts live in `scripts/` â€” use Node ESM (`*.mjs`) with `@neondatabase/serverless` + dotenv

**Authentication (100% custom â€” NO Clerk)**
- `lib/auth/session.ts` â€” JWT sign/verify/delete with jose, 30-day cookie `fd_session`
- `middleware.ts` â€” Edge-compatible JWT guard
- `app/api/auth/login/route.ts` â€” accepts username OR phone number (smart detection)
- `app/api/auth/signup/route.ts` â€” creates user + farm + owner membership atomically
- `app/api/auth/logout/route.ts` â€” deletes cookie

**Signup flow**
- 2-step form: Step 1 (name, phone, email optional, username optional, password), Step 2 (farm name, farm type emoji selector, region)
- Username auto-generated from name if not provided (slugified, guaranteed unique)
- Phone normalized to `+355XXXXXXXXX` format
- Farm type: livestock | bees | poultry | crops | mixed
- 12 Albanian counties in region dropdown

**Login**
- Single identifier field â€” detects phone vs username automatically
- Show/hide password toggle
- Organic Biophilic style, 52px touch targets

**Dashboard (personalized per farm type)**
- Reads user's farm from DB, renders different action cards per farm type
- Livestock â†’ Animals, Health, Reminders
- Bees â†’ Hives, Inspections, Harvests
- Poultry â†’ Flocks, Daily records
- Crops â†’ Plots, Activities
- Mixed â†’ All 6 sections
- Greeting changes by time of day (MirÃ«mÃ«ngjes/MirÃ«dita/MirÃ«mbrÃ«ma)
- Sticky header with Leaf logo, Settings link, Logout button
- All SVG Lucide icons, 44px+ touch targets

**API layer (all written, not all tested)**
- `lib/api/middleware.ts` â€” `withAuth` (JWT â†’ user lookup), `withFarmAccess` (role check)
- All CRUD routes for: farms, members, sections, livestock, hives, poultry, crops, diary, reminders
- Push subscription + cron reminder sender
- Batch offline sync endpoint

**Beekeeper module (100% complete â€” May 27, 2026)**
- `scripts/migrate-v4.mjs` â€” applied: queen cols on hives, supers_count on inspections, hive_swarms table
- `db/schema.ts` â€” updated with new columns, `hiveSwarms` table + relations + types
- `lib/api/types.ts` â€” `INSPECTION_NOT_FOUND` error code added
- API routes under `app/api/farms/[farmId]/hives/`:
  - `[hiveId]/swarms/route.ts` â€” GET/POST swarms
  - `[hiveId]/inspections/[inspectionId]/route.ts` â€” GET/PUT/DELETE single inspection
- Updated hives POST/PUT and inspections POST to include new fields
- 7 UI screens under `app/(app)/hives/`:
  - `/hives` â€” grid with strength badge + overdue warning (>14 days) + archived hives toggle (`?archived=1`)
  - `/hives/new` â€” add hive form (all queen fields)
  - `/hives/[id]` â€” detail + mixed chronological timeline; inspection cards are tappable links
  - `/hives/[id]/edit` â€” edit hive (all fields + status change with deactivation warning)
  - `/hives/[id]/inspect` â€” new inspection form
  - `/hives/[id]/inspect/[inspectionId]` â€” edit/delete inspection (pre-populated, two-step delete confirm)
  - `/hives/[id]/harvest` â€” harvest recording
  - `/hives/[id]/swarm` â€” swarm recording with caught/lost + new hive link

---

### ðŸ”´ Not yet built

- **Livestock module UI**
- Crops module UI
- Poultry module UI
- Diary entry UI
- Reminders UI
- Offline sync client (IndexedDB + Dexie.js)
- Settings page
- Photo upload (Cloudinary)
- `hive_feedings` table + UI (deferred â€” add in a future session)

---

## Next Steps â€” Livestock Module (next priority)

Build the same pattern as beekeeper:
1. `/animals` â€” list of livestock with species filter
2. `/animals/new` â€” add animal form
3. `/animals/[id]` â€” animal detail with health + production timeline
4. `/animals/[id]/health` â€” health record form (vaccination, treatment, etc.)
5. `/animals/[id]/production` â€” production record (milk, wool, etc.)

---

## Database Schema (19 tables + 3 pending)

| Layer | Tables |
|---|---|
| â‘  Core | `users`, `farms`, `farm_members`, `farm_sections` |
| â‘¡ Livestock | `livestock`, `livestock_health`, `livestock_production` |
| â‘¢ Bees | `hives`, `hive_inspections`, `hive_harvests` + ðŸ”œ `hive_feedings`, `hive_swarms` |
| â‘£ Poultry | `poultry_flocks`, `poultry_daily_records` |
| â‘¤ Crops | `crop_plots`, `crop_seasons`, `crop_activities`, `crop_harvests` |
| â‘¥ Cross-cutting | `diary_entries`, `reminders`, `push_subscriptions`, `notification_log` |

---

## Architecture Rules (never violate)

1. **Offline-first always** â€” write to IndexedDB first, sync to Neon in background
2. **Albanian UI** â€” all user-facing strings in Albanian (next-intl not strictly required for every string yet, but keep language consistent)
3. **Phone is the primary identifier** â€” login works with phone OR username, never requires email
4. **No Clerk** â€” 100% custom JWT auth using bcryptjs + jose
5. **SVG icons only** â€” Lucide React, never emoji as UI icons
6. **Touch targets â‰¥ 44px** â€” min-h-[44px] or h-[52px] on all buttons/inputs
7. **Organic Biophilic style** â€” rounded-2xl/3xl, farm-green palette, natural shadows, clean whitespace
8. **One language, one codebase** â€” TypeScript everywhere, Next.js API routes

---

## How to Open a New Session

1. Open Claude Code in the project folder:  `C:\GIT\Ditari i Fermes\Ditari i Fermes`
2. Claude auto-reads `CLAUDE.md` â€” no need to re-explain anything
3. Say "continue from CLAUDE.md" or just describe what you want to build next

---

## How to Update This File

At the end of each session:
1. Update **"Last session"** date
2. Move completed items to âœ… Completed
3. Update **"Next Steps"** section
4. Add session notes to `FARM_DIARY_PROJECT.md` Â§ 10

---

*This file exists so Claude always knows exactly where we are. Keep it short and current.*
