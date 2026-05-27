# Farm Diary — Claude Context File
> This file is read automatically at the start of every session.  
> It tells Claude everything needed to continue work on this project without re-explaining from scratch.

---

## What This Project Is

**Farm Diary** (`farmdiary.al`) is a PWA (Progressive Web App) for Albanian farmers to digitally log and manage farm activities — replacing paper notebooks. Built in Albanian. Works offline. Free at MVP scale.

- **Owner:** Kevin (kevinzogu@gmail.com)
- **Stack:** Next.js 14 + TypeScript, Neon PostgreSQL, Drizzle ORM, Clerk (auth), IndexedDB/Dexie.js (offline), Web Push API, Cloudinary (photos), Vercel (hosting)
- **Status:** Planning / Design phase
- **Current phase:** Database schema designed. Drizzle ORM implementation not yet written.

---

## Key Files in This Folder

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file — auto-read every session |
| `FARM_DIARY_PROJECT.md` | Full living design document — read this for deep context |

> **Always read `FARM_DIARY_PROJECT.md` before doing any significant work.** It contains the full database schema, architecture decisions, roadmap, and session notes.

---

## Current State (updated each session)

**Last session:** May 27, 2026  
**Completed so far:**
- ✅ Full project analysis (from FarmDiary_Documentation.docx)
- ✅ Database schema designed — 19 tables across 6 layers (see FARM_DIARY_PROJECT.md § 6)
- ✅ Drizzle ORM schema written — `db/schema.ts` (all 19 tables + enums + relations + type exports)
- ✅ Drizzle config written — `db/drizzle.config.ts`
- ✅ DB client written — `db/index.ts` (shared `db` instance for the whole app)
- ✅ API layer fully built — all route files, middleware, types, cron job, sync endpoint

**API files written:**
- `lib/api/types.ts` — ApiResponse envelope, error codes, role constants
- `lib/api/middleware.ts` — withAuth, withFarmAccess (role-based), parsePagination, ok/err helpers
- `app/api/user/route.ts` — GET/PUT own profile
- `app/api/farms/route.ts` — list farms, create farm
- `app/api/farms/[farmId]/route.ts` — get/update/delete farm
- `app/api/farms/[farmId]/members/` — list, invite, change role, remove members
- `app/api/farms/[farmId]/sections/` — list, create sections
- `app/api/farms/[farmId]/livestock/` — CRUD animals + health + production sub-routes
- `app/api/farms/[farmId]/hives/` — CRUD hives + inspections + harvests sub-routes
- `app/api/farms/[farmId]/poultry/` — CRUD flocks + daily records (upsert per day)
- `app/api/farms/[farmId]/crops/` — plots → seasons → activities + harvests (nested)
- `app/api/farms/[farmId]/diary/` — list (filterable) + CRUD entries with author/manager edit guard
- `app/api/farms/[farmId]/reminders/` — CRUD with status filter
- `app/api/push/subscribe/` — save/remove push subscription
- `app/api/cron/send-reminders/` — daily cron: find due reminders, send Web Push, advance repeating
- `app/api/sync/` — batch offline sync endpoint (up to 200 mutations per request)
- `vercel.json` — cron schedule at 06:00 AM daily

**Not yet built:**
- Next.js project setup (package.json, tsconfig, env vars)
- Offline sync client (IndexedDB + Dexie.js + sync queue)
- Any frontend/UI code

**Next logical steps (pick up here):**
1. Build the offline sync client — `lib/offline/` (Dexie schema, write queue, background sync)
2. OR: Set up the Next.js project skeleton (package.json, tsconfig, env vars list)
3. OR: Start frontend — dashboard, diary entry form, animal list screens

---

## Database Schema Summary (19 tables)

| Layer | Tables |
|---|---|
| ① Core | `users`, `farms`, `farm_members`, `farm_sections` |
| ② Livestock | `livestock`, `livestock_health`, `livestock_production` |
| ③ Bees | `hives`, `hive_inspections`, `hive_harvests` |
| ④ Poultry | `poultry_flocks`, `poultry_daily_records` |
| ⑤ Crops | `crop_plots`, `crop_seasons`, `crop_activities`, `crop_harvests` |
| ⑥ Cross-cutting | `diary_entries`, `reminders`, `push_subscriptions`, `notification_log` |

Key design choices:
- **No JSONB** — all typed columns, specific tables per entity type
- **UUIDs everywhere** — safe for offline-generated IDs
- **Livestock is individual-animal level** — with self-referential lineage (mother_id, father_id)
- **Poultry is flock level** — not per-bird
- **Crops use Plot → Season → Activity hierarchy**
- **Diary entries are polymorphic** — one table, `subject_type` + `subject_id` refs any entity
- **farm_members has roles:** owner | manager | worker | viewer

---

## Critical Architecture Rules (never violate these)

1. **Offline-first always** — write to IndexedDB first, sync to Neon in background. Never block a user action on the network.
2. **Albanian UI** — every user-facing string goes through `messages/sq.json` via next-intl.
3. **Phone login preferred** — Clerk with SMS code, not just email.
4. **Photo compression on client** before Cloudinary upload (not in original docs — add this).
5. **One language, one codebase** — TypeScript everywhere, Next.js API routes, no separate backend until 5k+ users.

---

## How to Update This File

At the end of each session, update:
1. **"Last session"** date
2. **"Completed so far"** — add the ✅ item
3. **"Not yet built"** — remove what was completed
4. **"Next logical steps"** — update to reflect where we left off
5. Add a new entry in `FARM_DIARY_PROJECT.md` § 10 (Session Notes)

---

*This file exists so Claude always knows exactly where we are. Keep it short and current.*
