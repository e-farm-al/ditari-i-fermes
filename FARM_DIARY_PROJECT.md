# Farm Diary — Project Design Document
> **Living document.** Updated after every analysis session.  
> Last updated: May 27, 2026 · Session 1 (Project overview + Database design)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Target Users](#2-target-users)
3. [Core Problem & Value Proposition](#3-core-problem--value-proposition)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Database Design](#6-database-design)
7. [Key Design Decisions Log](#7-key-design-decisions-log)
8. [Build Roadmap](#8-build-roadmap)
9. [Launch & Monetization Strategy](#9-launch--monetization-strategy)
10. [Session Notes](#10-session-notes)

---

## 1. Project Overview

**Farm Diary** (`farmdiary.al`) is a web and mobile platform (PWA — Progressive Web App) designed to help Albanian farmers of all sizes log, track, and manage their farm activities digitally. It replaces paper notebooks with a structured, searchable, notification-powered digital diary.

| Field | Detail |
|---|---|
| Platform | PWA (web + installable on Android/iOS) |
| Primary Language | Albanian (shqip) |
| Target Market | Albania |
| Domain | farmdiary.al |
| Monthly Cost | $0/month at MVP scale ($10/yr for domain only) |
| Status | Planning / Design phase |

**Vision:** Every Albanian farmer — from a beekeeper in Shkodër to a cattle farmer in Korçë — can manage their farm from a smartphone, even without internet.

---

## 2. Target Users

| User Type | Farm Size | Primary Need |
|---|---|---|
| Small family farmers | 1–5 hectares | Simple daily log, reminders |
| Livestock farmers | Any | Animal health records, births, vaccinations |
| Beekeepers | Any | Hive inspections, honey yield, queen status |
| Poultry farmers | Any | Egg production, flock health, feeding |
| Crop farmers | Any | Planting, harvest, fertilizer logs |
| Large operations | 20+ hectares | Multi-user, reports, history |

**Market signals:**
- ~78% smartphone penetration in Albania (2024)
- ~40% of workforce in agriculture — massive potential user base
- Rural internet coverage: moderate, gaps exist → **offline mode is mandatory**
- Tech familiarity: low-medium among farmers → **UI must be extremely simple**
- Competition: near zero in Albania — clear market gap
- EU/government subsidy programs active and growing → app data directly helps subsidy claims

---

## 3. Core Problem & Value Proposition

Albanian farmers currently have no dedicated digital tool for farm record-keeping:
- No organized record of animal health, treatments, or births
- Forgetting seasonal tasks, vaccinations, or harvest times
- No way to review farm history or identify patterns over time
- Paper records get lost, damaged, or are hard to search
- EU/government subsidy applications require documented records

**The app's core value is a structured, searchable, offline-capable farm diary — in Albanian.**

---

## 4. Technology Stack

**Principle: One language (TypeScript), one codebase, one deployment. Zero monthly cost until paying users exist.**

| Layer | Technology | Why | Cost |
|---|---|---|---|
| Frontend | Next.js 14 + TypeScript | React framework, PWA support, file-based routing | Free |
| Mobile | PWA | Install from browser — no Play Store needed | Free |
| Backend/API | Next.js API Routes | Same project as frontend, serverless, zero config | Free |
| Database | Neon (PostgreSQL) | Serverless Postgres, 0.5 GB free, scales automatically | Free |
| ORM | Drizzle ORM | TypeScript-native, schema-as-code, fast migrations | Free |
| Auth | Clerk | Phone number login, 10k users free | Free |
| Offline storage | IndexedDB via Dexie.js | Browser-native DB, stores entries offline | Free |
| Push notifications | Web Push API | Native browser push, works on Android Chrome | Free |
| Photo storage | Cloudinary | 25 GB free, auto-compresses for mobile | Free |
| Hosting | Vercel | Git push to deploy, global CDN, free SSL | Free |
| CI/CD | GitHub Actions | Auto-test and deploy on every push | Free |
| Domain | .al domain | farmdiary.al | ~$10/yr |

### PWA vs Native App Decision
PWA chosen because:
- Free to publish (no $25 Play Store fee)
- Share via link — no weeks of app review
- Works offline (service worker)
- On Android, Chrome auto-prompts "Add to Home Screen" after 3 visits
- Can wrap in React Native later if needed

### Scalability Path
| Stage | Users | What Changes |
|---|---|---|
| MVP | 0–500 | Nothing — free tiers cover entirely |
| Growth | 500–5,000 | Neon paid (~$19/mo), Vercel Pro (~$20/mo) |
| Scale | 5,000–50,000 | Separate backend (Node.js + Fastify on Railway) |
| Enterprise | 50,000+ | AWS/DigitalOcean, read replicas, Redis caching |

---

## 5. System Architecture

### Architecture Layers

| Layer | Components | Responsibility |
|---|---|---|
| Client | Next.js PWA (browser + home screen) | UI, offline cache, push subscription |
| API | Next.js API Routes (serverless) | Auth, business logic, data validation |
| Data | Neon PostgreSQL + IndexedDB | Persistent storage (cloud + local) |
| Services | Cloudinary, Clerk, Web Push | Photos, identity, notifications |
| Infra | Vercel + GitHub Actions | Hosting, CI/CD, cron jobs |

### Offline-First Architecture (CRITICAL)
This is the most important design decision in the entire project.

**Flow:**
1. User opens app → Next.js loads from service worker cache (no internet needed)
2. User writes a diary entry → saved immediately to IndexedDB
3. App shows "Saved locally" indicator if offline
4. When internet returns → sync queue runs, pushes to Neon PostgreSQL
5. Conflict resolution: **last-write-wins by timestamp** (safest simple strategy)

> **Rule:** Never block a user action waiting for the network. Write to local first, sync in background. A farmer in a field with no signal must never see a loading spinner or error on a save.

### Push Notification Flow
1. User grants notification permission in browser
2. Browser generates push subscription object (endpoint + keys)
3. App saves subscription to Neon DB via API
4. Vercel Cron Job runs daily at 6:00 AM
5. Cron queries DB for reminders due today
6. Sends Web Push to each subscribed device
7. Browser shows notification — even if app is closed

### Authentication Flow
1. User visits farmdiary.al → Clerk shows login screen
2. Options: email or phone number (SMS code) — **phone preferred** for Albanian farmers
3. Clerk issues JWT session token
4. All API routes verify JWT before processing
5. Each user has a `userId` that links to their farms in the database

### Repository Structure
```
farmdiary/
├── app/
│   ├── (auth)/          ← login, register pages
│   ├── (app)/           ← protected pages (requires login)
│   │   ├── dashboard/
│   │   ├── diary/
│   │   ├── animals/
│   │   ├── reminders/
│   │   └── reports/
│   └── api/             ← backend API routes
│       ├── diary/
│       ├── animals/
│       ├── reminders/
│       └── push/
├── components/          ← shared UI components
├── db/
│   ├── schema.ts        ← Drizzle schema (source of truth)
│   └── migrations/      ← auto-generated SQL migrations
├── lib/
│   ├── offline/         ← IndexedDB + sync logic (most complex part)
│   ├── push/            ← Web Push helpers
│   └── utils/
├── public/
│   ├── manifest.json    ← PWA manifest
│   └── sw.js            ← service worker
└── messages/
    ├── sq.json          ← Albanian translations
    └── en.json          ← English translations
```

---

## 6. Database Design

> **Design principle:** No JSONB anywhere. Every meaningful field is a typed column. Full normalization per entity type — specific tables instead of a generic catch-all.

### Layer Overview

| Layer | Tables | Scope |
|---|---|---|
| ① Core | users, farms, farm_members, farm_sections | Identity, farm structure, roles |
| ② Livestock | livestock, livestock_health, livestock_production | Individual animals |
| ③ Bees | hives, hive_inspections, hive_harvests | Hive-level beekeeping |
| ④ Poultry | poultry_flocks, poultry_daily_records | Flock-level poultry |
| ⑤ Crops | crop_plots, crop_seasons, crop_activities, crop_harvests | Plot → Season → Activity |
| ⑥ Cross-cutting | diary_entries, reminders, push_subscriptions, notification_log | Logging, notifications |

**Total: 19 tables**

---

### ① CORE

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| clerk_id | varchar UNIQUE | Clerk auth user ID |
| name | varchar | |
| phone | varchar UNIQUE | Albanian phone number |
| email | varchar UNIQUE | |
| language | varchar | default 'sq' (Albanian) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `farms`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → users | |
| name | varchar | e.g. "Ferma e Agimit" |
| region | varchar | Albanian region/municipality |
| location | varchar | Village / address |
| size_hectares | decimal | |
| created_at | timestamptz | |

#### `farm_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| user_id | uuid FK → users | |
| role | enum | owner \| manager \| worker \| viewer |
| invited_by | uuid FK → users | |
| joined_at | timestamptz | |
| — | — | UNIQUE(farm_id, user_id) |

**Roles:**
- `owner` — full control, billing, delete farm
- `manager` — add/remove workers, all data access
- `worker` — create/edit entries, no admin
- `viewer` — read-only access (e.g. vet, cooperative inspector)

#### `farm_sections`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| name | varchar | e.g. "North Pasture", "Hive Area B" |
| type | enum | livestock \| bees \| poultry \| crops \| mixed |
| description | text | |

---

### ② LIVESTOCK (Individual Animal Level)

#### `livestock`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| section_id | uuid FK → farm_sections | nullable |
| species | enum (IDX) | cow \| sheep \| goat \| pig \| horse \| donkey \| other |
| tag_number | varchar (IDX) | Official ear tag / ID |
| name | varchar | Optional (e.g. "Lopa #12") |
| breed | varchar | |
| sex | enum | male \| female |
| date_of_birth | date | nullable |
| date_acquired | date | |
| acquisition_type | enum | born_on_farm \| purchased \| gifted |
| mother_id | uuid FK → livestock | nullable (self-referential lineage) |
| father_id | uuid FK → livestock | nullable |
| status | enum (IDX) | active \| sold \| deceased \| transferred |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `livestock_health`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| animal_id | uuid FK → livestock | |
| recorded_by | uuid FK → users | |
| record_type | enum (IDX) | vaccination \| treatment \| checkup \| illness \| surgery \| other |
| event_date | date (IDX) | |
| description | text | |
| medication | varchar | nullable |
| dosage | varchar | nullable |
| administered_by | varchar | vet name or worker |
| next_due_date | date (IDX) | nullable — used for reminders |
| created_at | timestamptz | |

#### `livestock_production`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| animal_id | uuid FK → livestock | |
| recorded_by | uuid FK → users | |
| production_type | enum (IDX) | milk \| wool \| meat \| other |
| quantity | decimal | |
| unit | varchar | e.g. "L", "kg" |
| recorded_date | date (IDX) | |
| notes | text | nullable |
| created_at | timestamptz | |

---

### ③ BEES (Hive Level)

#### `hives`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| section_id | uuid FK → farm_sections | nullable |
| hive_code | varchar (IDX) | e.g. "H01", "H02" |
| hive_type | enum | langstroth \| dadant \| top_bar \| warre \| other |
| installation_date | date | |
| location_notes | varchar | Where exactly on the farm |
| status | enum (IDX) | active \| inactive \| lost \| sold |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `hive_inspections`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| hive_id | uuid FK → hives | |
| inspector_id | uuid FK → users | |
| inspection_date | date (IDX) | |
| queen_present | boolean | |
| queen_status | enum | healthy \| laying \| unmated \| missing \| replaced |
| colony_strength | enum | very_weak \| weak \| moderate \| strong \| very_strong |
| frames_with_bees | smallint | |
| frames_with_brood | smallint | |
| honey_stores | enum | empty \| low \| adequate \| full |
| disease_signs | boolean | |
| disease_notes | text | nullable |
| temperament | enum | calm \| nervous \| aggressive |
| treatment_applied | varchar | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

#### `hive_harvests`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| hive_id | uuid FK → hives | |
| harvested_by | uuid FK → users | |
| harvest_date | date (IDX) | |
| honey_kg | decimal | |
| wax_kg | decimal | nullable |
| propolis_g | decimal | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

---

### ④ POULTRY (Flock Level)

#### `poultry_flocks`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| section_id | uuid FK → farm_sections | nullable |
| name | varchar | e.g. "Laying Hens Batch 3" |
| species | enum (IDX) | chicken \| duck \| turkey \| goose \| quail \| other |
| breed | varchar | |
| purpose | enum | eggs \| meat \| dual \| breeding |
| current_count | integer | Updated as mortality is logged |
| date_acquired | date | |
| acquisition_age_weeks | integer | nullable |
| status | enum (IDX) | active \| sold \| deceased \| disbanded |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `poultry_daily_records`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| flock_id | uuid FK → poultry_flocks | |
| recorded_by | uuid FK → users | |
| record_date | date (IDX) | |
| eggs_collected | integer | nullable |
| mortality_count | integer | default 0 |
| mortality_reason | varchar | nullable |
| feed_kg | decimal | nullable |
| water_liters | decimal | nullable |
| notes | text | nullable |
| created_at | timestamptz | |
| — | — | UNIQUE(flock_id, record_date) |

---

### ⑤ CROPS (Plot → Season → Activity)

#### `crop_plots`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| section_id | uuid FK → farm_sections | nullable |
| name | varchar | e.g. "North Field", "Plot A" |
| area_hectares | decimal | |
| soil_type | varchar | nullable |
| irrigation_type | enum | none \| drip \| sprinkler \| flood \| rain_only |
| status | enum (IDX) | active \| fallow \| sold |
| coordinates | text | nullable — GPS boundary for future use |
| notes | text | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `crop_seasons`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| plot_id | uuid FK → crop_plots | |
| created_by | uuid FK → users | |
| crop_type | varchar (IDX) | wheat, corn, tomatoes, etc. |
| variety | varchar | nullable |
| season_year | smallint (IDX) | |
| planting_date | date | nullable |
| expected_harvest_date | date | nullable |
| actual_harvest_date | date | nullable |
| seed_quantity_kg | decimal | nullable |
| status | enum (IDX) | planned \| planted \| growing \| harvested \| failed |
| notes | text | nullable |
| created_at | timestamptz | |

#### `crop_activities`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| season_id | uuid FK → crop_seasons | |
| performed_by | uuid FK → users | |
| activity_date | date (IDX) | |
| activity_type | enum | planting \| irrigation \| fertilization \| pesticide \| harvesting \| pruning \| weeding \| soil_prep \| other |
| product_used | varchar | nullable — fertilizer name, pesticide name |
| quantity | decimal | nullable |
| unit | varchar | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

#### `crop_harvests`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| season_id | uuid FK → crop_seasons | |
| harvested_by | uuid FK → users | |
| harvest_date | date (IDX) | |
| quantity_kg | decimal | |
| quality | enum | excellent \| good \| fair \| poor |
| storage_location | varchar | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

---

### ⑥ CROSS-CUTTING

#### `diary_entries`
Free-text log entries attachable to any entity in the system.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| author_id | uuid FK → users | |
| entry_date | date (IDX) | When it happened (may differ from created_at) |
| subject_type | enum (IDX) | livestock \| hive \| flock \| plot \| farm — polymorphic ref |
| subject_id | uuid (IDX) | ID of the referenced entity — enforced in app layer |
| category | enum | health \| feeding \| production \| weather \| maintenance \| financial \| observation \| other |
| title | varchar | nullable |
| notes | text | Free-text in Albanian |
| photo_urls | text[] | Array of Cloudinary URLs |
| synced_at | timestamptz | null = written while online; timestamp = synced from offline |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> Note: `subject_type` + `subject_id` is a polymorphic reference — no DB-level FK constraint. Integrity enforced at application layer.

#### `reminders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| farm_id | uuid FK → farms | |
| created_by | uuid FK → users | |
| subject_type | varchar | nullable — polymorphic ref |
| subject_id | uuid | nullable |
| title | varchar | e.g. "Vaksina për lopa" |
| due_date | date (IDX) | |
| due_time | time | nullable |
| repeat_type | enum | none \| daily \| weekly \| monthly \| yearly |
| repeat_interval | smallint | default 1 (every N periods) |
| repeat_end_date | date | nullable |
| status | enum (IDX) | pending \| sent \| dismissed \| completed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `push_subscriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users | |
| endpoint | text | Browser push endpoint URL |
| p256dh | text | Encryption key |
| auth_key | text | Auth secret |
| device_info | varchar | nullable — browser/OS identifier |
| created_at | timestamptz | |
| last_used_at | timestamptz | |

#### `notification_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| reminder_id | uuid FK → reminders | |
| subscription_id | uuid FK → push_subscriptions | |
| sent_at | timestamptz | |
| status | enum | sent \| failed \| delivered |
| error_message | text | nullable |

---

### Database Design Rationale

| Decision | Choice | Reason |
|---|---|---|
| No JSONB | All typed columns | Clean queries, easy aggregations, proper indexing |
| Separate tables per entity type | Yes | Livestock ≠ Hives ≠ Poultry — each has unique fields |
| Self-referential FK on livestock | mother_id, father_id | Enables lineage tracking for breeding programs |
| Poultry at flock level | poultry_flocks | Individual bird tracking not practical at scale |
| crop_plots → crop_seasons | 1:many | One field can grow different crops each year |
| Polymorphic diary_entries | subject_type + subject_id | One diary table for all entity types |
| UUIDs everywhere | uuid PK | Safe for offline-generated IDs (no server round-trip on write) |
| entry_date vs created_at | Both | Farmer may log yesterday's events today |
| synced_at column | timestamptz nullable | Track which entries came from offline mode |
| UNIQUE(flock_id, record_date) | On poultry_daily_records | Prevent duplicate daily records during sync |
| UNIQUE(farm_id, user_id) | On farm_members | Prevent duplicate memberships |
| IDX on status, date, type columns | Key query filters | Almost every query filters by farm + date or farm + status |

---

## 7. Key Design Decisions Log

| # | Decision | Chosen | Rejected | Reason |
|---|---|---|---|---|
| 1 | Platform | PWA (web) | Native React Native | No Play Store cost, web reaches everyone |
| 2 | Frontend | Next.js | Vue / Svelte | Largest ecosystem, best AI tooling, Vercel pairing |
| 3 | Backend | Next.js API Routes | Separate Express server | Zero extra hosting cost, same codebase |
| 4 | Database | Neon PostgreSQL | MongoDB | JSONB gives flexibility; relations give reporting power |
| 5 | Auth | Clerk | Auth.js (NextAuth) | Phone number login is critical; Clerk supports it natively |
| 6 | Offline | IndexedDB + Dexie.js | localStorage | localStorage has 5MB limit; IndexedDB is unlimited |
| 7 | Push | Web Push API | Firebase Cloud Messaging | FCM adds Google dependency; Web Push is native and free |
| 8 | Language | Albanian-first | Multi-language from start | Focus on primary market; add English later |
| 9 | Farm types | All 4 at launch | Livestock only first | More complete product; AI-assisted development makes it feasible |
| 10 | DB schema | Specific typed tables | Generic JSONB per entity | Clean queries, proper indexes, no ambiguity in field types |
| 11 | Animal granularity | Individual livestock, flock-level poultry | Both individual | Practical — no farmer tracks each chicken individually |
| 12 | Lineage tracking | mother_id / father_id on livestock | Separate lineage table | Simple enough for MVP; covers main breeding use cases |

---

## 8. Build Roadmap

**Context:** Solo developer, AI-assisted coding (Claude/Cursor), ~3–4 hours/day. AI handles ~70% of code; developer handles decisions, testing, and Albanian UX.

| Phase | Focus | Duration | Cumulative |
|---|---|---|---|
| 1 | Setup & foundations | 3–4 days | Week 1 |
| 2 | Database design & migrations | 2–3 days | Week 1–2 |
| 3 | Core features (diary + farm management) | 2–3 weeks | Week 2–5 |
| 4 | Reminders & notifications | 1 week | Week 5–6 |
| 5 | Offline sync | 1–2 weeks | Week 6–8 |
| 6 | History, reports & polish | 1 week | Week 8–9 |
| 7 | Testing & launch | 1 week | Week 9–10 |

**Total: 7–10 weeks part-time**

### Phase 1 — Setup & Foundations (Days 1–4)
- Create Next.js project + TypeScript config
- Connect Neon database + Drizzle ORM
- Set up Clerk authentication (phone login)
- Configure PWA (manifest + service worker)
- Deploy to Vercel + connect domain
- Set up GitHub repo + CI/CD
- Albanian i18n setup (next-intl)

### Phase 2 — Database Design (Days 5–7)
- Write Drizzle schema file (all 19 tables)
- Run initial migrations on Neon
- Create seed data for development testing

### Phase 3 — Core Features (Weeks 2–5)
Build in order: farm setup → diary entry → livestock → hives → poultry → crops
- Farm setup screen (name, sections, members)
- Dashboard home screen
- Diary entry: create, view, edit, delete
- Livestock records (individual animals)
- Hive records + inspection forms
- Poultry flock records + daily logs
- Crop plot + season management
- Photo upload with Cloudinary (with client-side compression before upload)
- Mobile-responsive UI (all screens)
- Albanian translations (all strings)

### Phase 4 — Reminders & Notifications (Week 5–6)
- Reminder creation UI (date, repeat, subject)
- Web Push permission request flow
- Store push subscriptions in DB
- Vercel Cron Job (daily check + send)
- Test notifications on real Android device

### Phase 5 — Offline Sync (Weeks 6–8)
⚠️ Most complex phase — budget extra time.
- Set up Dexie.js IndexedDB schema (mirrors server schema)
- Write-to-local-first wrapper for all mutations
- Background sync queue (retry on reconnect)
- Conflict resolution (last-write-wins by timestamp)
- Offline status indicator in UI
- Test: airplane mode → add entry → reconnect → verify sync

### Phase 6 — History, Reports & Polish (Week 8–9)
- Farm timeline view (entries by date)
- Basic charts (milk production, egg count, etc.)
- PDF export of diary entries (for subsidy applications)
- Loading states + error handling everywhere
- Empty state screens (first-time user experience)

### Phase 7 — Testing & Launch (Week 9–10)
- Recruit 5–10 real Albanian farmers for testing (mixed farm types)
- Observe testing sessions — take notes, don't explain the app
- Fix top 5 usability issues found
- Performance audit (mobile, slow 3G)
- Announce to farming Facebook groups and WhatsApp groups

---

## 9. Launch & Monetization Strategy

### Pre-Launch
1. Build MVP with all 4 farm types
2. Recruit 5–10 farmers from network for beta testing
3. Run testing sessions in person — observe, don't explain
4. Fix top issues from feedback
5. Translate 100% of UI to Albanian

### Launch Channels
| Channel | Why It Works | Action |
|---|---|---|
| Facebook groups (farming) | Albanian farmers very active on FB | Post demo video + link |
| WhatsApp groups | Word-of-mouth in rural areas | Ask beta testers to share |
| Local vet clinics | Farmers visit regularly, trust their vet | Leave QR code flyers |
| Agricultural ministry | Want digital records for subsidy programs | Pitch as subsidy tool |
| University agriculture depts | Credibility + early adopters | Partner for research |

### Monetization (when ready — not before 100 active users)
| Model | Description | Price |
|---|---|---|
| Free forever | Diary + reminders for 1 farm, basic reports | Free |
| Pro | Multiple farms, PDF export, charts, photo storage | 500–800 ALL/month |
| Cooperative plan | One account, multiple member farms | 3,000–5,000 ALL/month |
| Government/NGO | Bulk license for agricultural extension programs | Negotiated |

---

## 10. Session Notes

### Session 3 — May 27, 2026
**What we built — full API layer:**
- `lib/api/types.ts` — ApiSuccess/ApiError envelope, centralised API_ERRORS codes, role constants (WRITE_ROLES, ADMIN_ROLES, OWNER_ONLY)
- `lib/api/middleware.ts` — `withAuth` (Clerk → internal user, auto-creates on first call), `withFarmAccess` (role hierarchy check), `parsePagination`, `ok`/`err` helpers
- All route files across 9 entity groups + cron + batch sync (see CLAUDE.md for full file list)
- `vercel.json` — Vercel Cron at 06:00 AM daily targeting send-reminders

**Key implementation decisions made:**
- Poultry daily records use `.onConflictDoUpdate` — safe for offline re-delivery of same-day record
- Diary and livestock offline creates use `.onConflictDoNothing` with client UUID — idempotent
- Cron advances repeating reminders' `dueDate` instead of creating new rows
- Diary edit/delete guards: author OR manager+ can act — not just managers
- Batch sync endpoint `/api/sync` handles up to 200 mutations per request, returns per-item results so client can retry only failed items
- `withFarmAccess` auto-returns 403 before handler runs — no guard boilerplate in routes

**Next session should cover:**
- Offline sync client (`lib/offline/`) — Dexie.js schema, mutation queue, background sync trigger
- OR: Next.js project skeleton — package.json, tsconfig, .env.example
- OR: Frontend UI — starting with dashboard + diary entry screen

---

### Session 2 — May 27, 2026
**What we built:**
- `db/schema.ts` — Full Drizzle ORM implementation of all 19 tables
  - All enums defined as `pgEnum` (28 enums total)
  - All indexes and unique constraints declared inline
  - Self-referential livestock lineage (mother/father) with named relation
  - `UNIQUE(flock_id, record_date)` on `poultry_daily_records` to guard against offline sync duplicates
  - Full Drizzle `relations()` map for the query builder
  - Inferred TypeScript types exported for every table (`User`, `NewUser`, `Farm`, etc.)
- `db/drizzle.config.ts` — Drizzle Kit config (schema path, migrations output, strict mode on)
- `db/index.ts` — Shared `db` client using `neon()` + `drizzle-orm/neon-http`; re-exports all schema symbols

**Next session should cover:**
- API route design — endpoint map, auth middleware pattern, request/response types
- OR: Offline sync architecture — Dexie.js schema, sync queue implementation

---

### Session 1 — May 27, 2026
**What we analyzed:**
- Full project documentation review (FarmDiary_Documentation.docx)
- Market viability assessment → GO verdict confirmed
- Identified risk: "all 4 farm types at launch" increases scope vs. original "livestock only" risk mitigation plan
- Identified gap: iOS push notification limitation (requires home screen install on iOS 16.4+)
- Identified gap: photo compression needed before Cloudinary upload (not in original docs)
- Identified gap: conflict resolution on offline sync needs more thought (not just last-write-wins — multi-worker scenario)

**Database design session:**
- Replaced original generic JSONB approach with 19 specific typed tables
- Designed 6-layer schema: Core → Livestock → Bees → Poultry → Crops → Cross-cutting
- Key additions vs. original doc: farm_sections, farm_members (with roles), self-referential lineage on livestock, inspection-specific hive table, crop_seasons hierarchy, notification_log for push audit

**Next session should cover:**
- Drizzle ORM schema file (TypeScript implementation of the 19-table design)
- Or: offline sync architecture deep-dive
- Or: API route design and auth middleware pattern

---

*Farm Diary — Built for Albanian farmers · farmdiary.al*
