/**
 * Farm Diary — Drizzle ORM Schema
 * Single source of truth for the entire database.
 * 19 tables across 6 layers.
 *
 * Run migrations:  npx drizzle-kit push
 * Generate SQL:    npx drizzle-kit generate
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  smallint,
  decimal,
  date,
  time,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// TIMESTAMPS HELPER
// ---------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

// Core
export const farmMemberRoleEnum = pgEnum("farm_member_role", [
  "owner",
  "manager",
  "worker",
  "viewer",
]);

export const farmSectionTypeEnum = pgEnum("farm_section_type", [
  "livestock",
  "bees",
  "poultry",
  "crops",
  "mixed",
]);

// Livestock
export const livestockSpeciesEnum = pgEnum("livestock_species", [
  "cow",
  "sheep",
  "goat",
  "pig",
  "horse",
  "donkey",
  "other",
]);

export const livestockSexEnum = pgEnum("livestock_sex", ["male", "female"]);

export const livestockAcquisitionEnum = pgEnum("livestock_acquisition", [
  "born_on_farm",
  "purchased",
  "gifted",
]);

export const livestockStatusEnum = pgEnum("livestock_status", [
  "active",
  "sold",
  "deceased",
  "transferred",
]);

export const livestockHealthTypeEnum = pgEnum("livestock_health_type", [
  "vaccination",
  "treatment",
  "checkup",
  "illness",
  "surgery",
  "other",
]);

export const livestockProductionTypeEnum = pgEnum("livestock_production_type", [
  "milk",
  "wool",
  "meat",
  "other",
]);

// Bees
export const hiveTypeEnum = pgEnum("hive_type", [
  "langstroth",
  "dadant",
  "top_bar",
  "warre",
  "other",
]);

export const hiveStatusEnum = pgEnum("hive_status", [
  "active",
  "inactive",
  "lost",
  "sold",
]);

export const queenStatusEnum = pgEnum("queen_status", [
  "healthy",
  "laying",
  "unmated",
  "missing",
  "replaced",
]);

export const colonyStrengthEnum = pgEnum("colony_strength", [
  "very_weak",
  "weak",
  "moderate",
  "strong",
  "very_strong",
]);

export const honeyStoresEnum = pgEnum("honey_stores", [
  "empty",
  "low",
  "adequate",
  "full",
]);

export const hiveTemperamentEnum = pgEnum("hive_temperament", [
  "calm",
  "nervous",
  "aggressive",
]);

// Poultry
export const poultrySpeciesEnum = pgEnum("poultry_species", [
  "chicken",
  "duck",
  "turkey",
  "goose",
  "quail",
  "other",
]);

export const poultryPurposeEnum = pgEnum("poultry_purpose", [
  "eggs",
  "meat",
  "dual",
  "breeding",
]);

export const poultryStatusEnum = pgEnum("poultry_status", [
  "active",
  "sold",
  "deceased",
  "disbanded",
]);

// Crops
export const irrigationTypeEnum = pgEnum("irrigation_type", [
  "none",
  "drip",
  "sprinkler",
  "flood",
  "rain_only",
]);

export const plotStatusEnum = pgEnum("plot_status", [
  "active",
  "fallow",
  "sold",
]);

export const cropSeasonStatusEnum = pgEnum("crop_season_status", [
  "planned",
  "planted",
  "growing",
  "harvested",
  "failed",
]);

export const cropActivityTypeEnum = pgEnum("crop_activity_type", [
  "planting",
  "irrigation",
  "fertilization",
  "pesticide",
  "harvesting",
  "pruning",
  "weeding",
  "soil_prep",
  "other",
]);

export const harvestQualityEnum = pgEnum("harvest_quality", [
  "excellent",
  "good",
  "fair",
  "poor",
]);

// Cross-cutting
export const diarySubjectTypeEnum = pgEnum("diary_subject_type", [
  "livestock",
  "hive",
  "flock",
  "plot",
  "farm",
]);

export const diaryCategoryEnum = pgEnum("diary_category", [
  "health",
  "feeding",
  "production",
  "weather",
  "maintenance",
  "financial",
  "observation",
  "other",
]);

export const reminderRepeatEnum = pgEnum("reminder_repeat", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "pending",
  "sent",
  "dismissed",
  "completed",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "failed",
  "delivered",
]);

// ---------------------------------------------------------------------------
// LAYER ① — CORE
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 60 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  phone: varchar("phone", { length: 30 }).unique(),
  language: varchar("language", { length: 5 }).notNull().default("sq"),
  ...timestamps,
});

export const farms = pgTable("farms", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  farmType: farmSectionTypeEnum("farm_type").notNull().default("mixed"),
  region: varchar("region", { length: 100 }),
  location: varchar("location", { length: 255 }),
  sizeHectares: decimal("size_hectares", { precision: 8, scale: 2 }),
  ...timestamps,
});

export const farmMembers = pgTable(
  "farm_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: farmMemberRoleEnum("role").notNull().default("worker"),
    invitedBy: uuid("invited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    // A user can only be a member of a farm once
    uniqueMembership: uniqueIndex("farm_members_farm_user_unique").on(
      t.farmId,
      t.userId
    ),
  })
);

export const farmSections = pgTable("farm_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: farmSectionTypeEnum("type").notNull(),
  description: text("description"),
  ...timestamps,
});

// ---------------------------------------------------------------------------
// LAYER ② — LIVESTOCK (individual animal level)
// ---------------------------------------------------------------------------

export const livestock = pgTable(
  "livestock",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => farmSections.id, {
      onDelete: "set null",
    }),
    species: livestockSpeciesEnum("species").notNull(),
    tagNumber: varchar("tag_number", { length: 100 }),
    name: varchar("name", { length: 100 }),
    breed: varchar("breed", { length: 100 }),
    sex: livestockSexEnum("sex").notNull(),
    dateOfBirth: date("date_of_birth"),
    dateAcquired: date("date_acquired").notNull(),
    acquisitionType: livestockAcquisitionEnum("acquisition_type")
      .notNull()
      .default("born_on_farm"),
    // Self-referential lineage
    motherId: uuid("mother_id"), // .references(() => livestock.id) — set below via relations
    fatherId: uuid("father_id"),
    status: livestockStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("livestock_farm_idx").on(t.farmId),
    speciesIdx: index("livestock_species_idx").on(t.species),
    statusIdx: index("livestock_status_idx").on(t.status),
    tagIdx: index("livestock_tag_idx").on(t.tagNumber),
  })
);

export const livestockHealth = pgTable(
  "livestock_health",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    animalId: uuid("animal_id")
      .notNull()
      .references(() => livestock.id, { onDelete: "cascade" }),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recordType: livestockHealthTypeEnum("record_type").notNull(),
    eventDate: date("event_date").notNull(),
    description: text("description").notNull(),
    medication: varchar("medication", { length: 255 }),
    dosage: varchar("dosage", { length: 100 }),
    administeredBy: varchar("administered_by", { length: 255 }),
    nextDueDate: date("next_due_date"),
    ...timestamps,
  },
  (t) => ({
    animalIdx: index("livestock_health_animal_idx").on(t.animalId),
    eventDateIdx: index("livestock_health_date_idx").on(t.eventDate),
    nextDueDateIdx: index("livestock_health_next_due_idx").on(t.nextDueDate),
    recordTypeIdx: index("livestock_health_type_idx").on(t.recordType),
  })
);

export const livestockProduction = pgTable(
  "livestock_production",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    animalId: uuid("animal_id")
      .notNull()
      .references(() => livestock.id, { onDelete: "cascade" }),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    productionType: livestockProductionTypeEnum("production_type").notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(), // "L", "kg"
    recordedDate: date("recorded_date").notNull(),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    animalIdx: index("livestock_production_animal_idx").on(t.animalId),
    dateIdx: index("livestock_production_date_idx").on(t.recordedDate),
    typeIdx: index("livestock_production_type_idx").on(t.productionType),
  })
);

// ---------------------------------------------------------------------------
// LAYER ③ — BEES (hive level)
// ---------------------------------------------------------------------------

export const hives = pgTable(
  "hives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => farmSections.id, {
      onDelete: "set null",
    }),
    hiveCode: varchar("hive_code", { length: 50 }).notNull(), // "H01", "H02"
    hiveType: hiveTypeEnum("hive_type").notNull().default("langstroth"),
    installationDate: date("installation_date"),
    locationNotes: varchar("location_notes", { length: 255 }),
    status: hiveStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    queenIntroduced: date("queen_introduced"),
    queenYearColor: smallint("queen_year_color"),
    queenSource: varchar("queen_source", { length: 100 }),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("hives_farm_idx").on(t.farmId),
    statusIdx: index("hives_status_idx").on(t.status),
    codeIdx: index("hives_code_idx").on(t.hiveCode),
  })
);

export const hiveInspections = pgTable(
  "hive_inspections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    inspectorId: uuid("inspector_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    inspectionDate: date("inspection_date").notNull(),
    queenPresent: boolean("queen_present").notNull().default(true),
    queenStatus: queenStatusEnum("queen_status"),
    colonyStrength: colonyStrengthEnum("colony_strength"),
    framesWithBees: smallint("frames_with_bees"),
    framesWithBrood: smallint("frames_with_brood"),
    honeyStores: honeyStoresEnum("honey_stores"),
    diseaseSigns: boolean("disease_signs").notNull().default(false),
    diseaseNotes: text("disease_notes"),
    temperament: hiveTemperamentEnum("temperament"),
    treatmentApplied: varchar("treatment_applied", { length: 255 }),
    supersCount: smallint("supers_count"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    hiveIdx: index("hive_inspections_hive_idx").on(t.hiveId),
    dateIdx: index("hive_inspections_date_idx").on(t.inspectionDate),
  })
);

export const hiveHarvests = pgTable(
  "hive_harvests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    harvestedBy: uuid("harvested_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    harvestDate: date("harvest_date").notNull(),
    honeyKg: decimal("honey_kg", { precision: 8, scale: 3 }).notNull(),
    waxKg: decimal("wax_kg", { precision: 8, scale: 3 }),
    propolisG: decimal("propolis_g", { precision: 8, scale: 2 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    hiveIdx: index("hive_harvests_hive_idx").on(t.hiveId),
    dateIdx: index("hive_harvests_date_idx").on(t.harvestDate),
  })
);

export const hiveSwarms = pgTable(
  "hive_swarms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hiveId: uuid("hive_id")
      .notNull()
      .references(() => hives.id, { onDelete: "cascade" }),
    swarmDate: date("swarm_date").notNull(),
    caught: boolean("caught").notNull().default(false),
    newHiveId: uuid("new_hive_id").references(() => hives.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    hiveIdx: index("hive_swarms_hive_idx").on(t.hiveId),
    dateIdx: index("hive_swarms_date_idx").on(t.swarmDate),
  })
);

// ---------------------------------------------------------------------------
// LAYER ④ — POULTRY (flock level)
// ---------------------------------------------------------------------------

export const poultryFlocks = pgTable(
  "poultry_flocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => farmSections.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    species: poultrySpeciesEnum("species").notNull(),
    breed: varchar("breed", { length: 100 }),
    purpose: poultryPurposeEnum("purpose").notNull(),
    currentCount: integer("current_count").notNull().default(0),
    dateAcquired: date("date_acquired").notNull(),
    acquisitionAgeWeeks: smallint("acquisition_age_weeks"),
    status: poultryStatusEnum("status").notNull().default("active"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("poultry_flocks_farm_idx").on(t.farmId),
    speciesIdx: index("poultry_flocks_species_idx").on(t.species),
    statusIdx: index("poultry_flocks_status_idx").on(t.status),
  })
);

export const poultryDailyRecords = pgTable(
  "poultry_daily_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flockId: uuid("flock_id")
      .notNull()
      .references(() => poultryFlocks.id, { onDelete: "cascade" }),
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recordDate: date("record_date").notNull(),
    eggsCollected: integer("eggs_collected"),
    mortalityCount: integer("mortality_count").notNull().default(0),
    mortalityReason: varchar("mortality_reason", { length: 255 }),
    feedKg: decimal("feed_kg", { precision: 8, scale: 2 }),
    waterLiters: decimal("water_liters", { precision: 8, scale: 2 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    // Only one record per flock per day — prevents offline sync duplicates
    uniqueDailyRecord: uniqueIndex("poultry_daily_records_unique").on(
      t.flockId,
      t.recordDate
    ),
    flockIdx: index("poultry_daily_records_flock_idx").on(t.flockId),
    dateIdx: index("poultry_daily_records_date_idx").on(t.recordDate),
  })
);

// ---------------------------------------------------------------------------
// LAYER ⑤ — CROPS (plot → season → activity)
// ---------------------------------------------------------------------------

export const cropPlots = pgTable(
  "crop_plots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => farmSections.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    areaHectares: decimal("area_hectares", { precision: 8, scale: 4 }),
    soilType: varchar("soil_type", { length: 100 }),
    irrigationType: irrigationTypeEnum("irrigation_type")
      .notNull()
      .default("none"),
    status: plotStatusEnum("status").notNull().default("active"),
    coordinates: text("coordinates"), // GeoJSON or WKT for future use
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("crop_plots_farm_idx").on(t.farmId),
    statusIdx: index("crop_plots_status_idx").on(t.status),
  })
);

export const cropSeasons = pgTable(
  "crop_seasons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    plotId: uuid("plot_id")
      .notNull()
      .references(() => cropPlots.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    cropType: varchar("crop_type", { length: 100 }).notNull(), // wheat, corn, tomatoes...
    variety: varchar("variety", { length: 100 }),
    seasonYear: smallint("season_year").notNull(),
    plantingDate: date("planting_date"),
    expectedHarvestDate: date("expected_harvest_date"),
    actualHarvestDate: date("actual_harvest_date"),
    seedQuantityKg: decimal("seed_quantity_kg", { precision: 8, scale: 3 }),
    status: cropSeasonStatusEnum("status").notNull().default("planned"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    plotIdx: index("crop_seasons_plot_idx").on(t.plotId),
    yearIdx: index("crop_seasons_year_idx").on(t.seasonYear),
    cropTypeIdx: index("crop_seasons_crop_type_idx").on(t.cropType),
    statusIdx: index("crop_seasons_status_idx").on(t.status),
  })
);

export const cropActivities = pgTable(
  "crop_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => cropSeasons.id, { onDelete: "cascade" }),
    performedBy: uuid("performed_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    activityDate: date("activity_date").notNull(),
    activityType: cropActivityTypeEnum("activity_type").notNull(),
    productUsed: varchar("product_used", { length: 255 }), // fertilizer, pesticide name
    quantity: decimal("quantity", { precision: 10, scale: 3 }),
    unit: varchar("unit", { length: 30 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    seasonIdx: index("crop_activities_season_idx").on(t.seasonId),
    dateIdx: index("crop_activities_date_idx").on(t.activityDate),
    typeIdx: index("crop_activities_type_idx").on(t.activityType),
  })
);

export const cropHarvests = pgTable(
  "crop_harvests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id")
      .notNull()
      .references(() => cropSeasons.id, { onDelete: "cascade" }),
    harvestedBy: uuid("harvested_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    harvestDate: date("harvest_date").notNull(),
    quantityKg: decimal("quantity_kg", { precision: 10, scale: 3 }).notNull(),
    quality: harvestQualityEnum("quality"),
    storageLocation: varchar("storage_location", { length: 255 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    seasonIdx: index("crop_harvests_season_idx").on(t.seasonId),
    dateIdx: index("crop_harvests_date_idx").on(t.harvestDate),
  })
);

// ---------------------------------------------------------------------------
// LAYER ⑥ — CROSS-CUTTING
// ---------------------------------------------------------------------------

export const diaryEntries = pgTable(
  "diary_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    entryDate: date("entry_date").notNull(),
    // Polymorphic reference — integrity enforced at app layer
    subjectType: diarySubjectTypeEnum("subject_type"),
    subjectId: uuid("subject_id"),
    category: diaryCategoryEnum("category").notNull().default("observation"),
    title: varchar("title", { length: 255 }),
    notes: text("notes").notNull(),
    // Array of Cloudinary URLs
    photoUrls: text("photo_urls").array().default([]),
    // null = written while online; timestamp = arrived from offline sync
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("diary_entries_farm_idx").on(t.farmId),
    entryDateIdx: index("diary_entries_date_idx").on(t.entryDate),
    subjectIdx: index("diary_entries_subject_idx").on(
      t.subjectType,
      t.subjectId
    ),
    categoryIdx: index("diary_entries_category_idx").on(t.category),
  })
);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // Polymorphic reference (optional — can be farm-wide)
    subjectType: varchar("subject_type", { length: 50 }),
    subjectId: uuid("subject_id"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    dueDate: date("due_date").notNull(),
    dueTime: time("due_time"),
    repeatType: reminderRepeatEnum("repeat_type").notNull().default("none"),
    repeatInterval: smallint("repeat_interval").notNull().default(1),
    repeatEndDate: date("repeat_end_date"),
    status: reminderStatusEnum("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => ({
    farmIdx: index("reminders_farm_idx").on(t.farmId),
    dueDateIdx: index("reminders_due_date_idx").on(t.dueDate),
    statusIdx: index("reminders_status_idx").on(t.status),
  })
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  authKey: text("auth_key").notNull(),
  deviceInfo: varchar("device_info", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  reminderId: uuid("reminder_id")
    .notNull()
    .references(() => reminders.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => pushSubscriptions.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  status: notificationStatusEnum("status").notNull().default("sent"),
  errorMessage: text("error_message"),
});

// ---------------------------------------------------------------------------
// LAYER ⑦ — QR CODES (stable short codes for physical labels)
// ---------------------------------------------------------------------------

export const qrCodes = pgTable(
  "qr_codes",
  {
    // 6-char uppercase alphanumeric — permanent, never changes even if domain changes
    code: varchar("code", { length: 10 }).primaryKey(),
    // "hive" | "animal" | "flock" | "plot"
    entityType: varchar("entity_type", { length: 20 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    // Future: share_token for vet/inspector read-only access
    // shareToken: varchar("share_token", { length: 32 }).unique(),
    // shareExpiresAt: timestamp("share_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    entityIdx: index("qr_codes_entity_idx").on(t.entityType, t.entityId),
    farmIdx: index("qr_codes_farm_idx").on(t.farmId),
  })
);

// ---------------------------------------------------------------------------
// RELATIONS
// (Drizzle relations are used by the query builder — not DB constraints)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  ownedFarms: many(farms),
  farmMemberships: many(farmMembers),
  diaryEntries: many(diaryEntries),
  reminders: many(reminders),
  pushSubscriptions: many(pushSubscriptions),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  owner: one(users, { fields: [farms.ownerId], references: [users.id] }),
  members: many(farmMembers),
  sections: many(farmSections),
  livestock: many(livestock),
  hives: many(hives),
  poultryFlocks: many(poultryFlocks),
  cropPlots: many(cropPlots),
  diaryEntries: many(diaryEntries),
  reminders: many(reminders),
}));

export const farmMembersRelations = relations(farmMembers, ({ one }) => ({
  farm: one(farms, { fields: [farmMembers.farmId], references: [farms.id] }),
  user: one(users, { fields: [farmMembers.userId], references: [users.id] }),
  invitedByUser: one(users, {
    fields: [farmMembers.invitedBy],
    references: [users.id],
  }),
}));

export const farmSectionsRelations = relations(farmSections, ({ one, many }) => ({
  farm: one(farms, { fields: [farmSections.farmId], references: [farms.id] }),
  livestock: many(livestock),
  hives: many(hives),
  poultryFlocks: many(poultryFlocks),
  cropPlots: many(cropPlots),
}));

export const livestockRelations = relations(livestock, ({ one, many }) => ({
  farm: one(farms, { fields: [livestock.farmId], references: [farms.id] }),
  section: one(farmSections, {
    fields: [livestock.sectionId],
    references: [farmSections.id],
  }),
  mother: one(livestock, {
    fields: [livestock.motherId],
    references: [livestock.id],
    relationName: "parentChild",
  }),
  father: one(livestock, {
    fields: [livestock.fatherId],
    references: [livestock.id],
    relationName: "parentChild",
  }),
  healthRecords: many(livestockHealth),
  productionRecords: many(livestockProduction),
}));

export const livestockHealthRelations = relations(livestockHealth, ({ one }) => ({
  animal: one(livestock, {
    fields: [livestockHealth.animalId],
    references: [livestock.id],
  }),
  recordedByUser: one(users, {
    fields: [livestockHealth.recordedBy],
    references: [users.id],
  }),
}));

export const livestockProductionRelations = relations(
  livestockProduction,
  ({ one }) => ({
    animal: one(livestock, {
      fields: [livestockProduction.animalId],
      references: [livestock.id],
    }),
    recordedByUser: one(users, {
      fields: [livestockProduction.recordedBy],
      references: [users.id],
    }),
  })
);

export const hivesRelations = relations(hives, ({ one, many }) => ({
  farm: one(farms, { fields: [hives.farmId], references: [farms.id] }),
  section: one(farmSections, {
    fields: [hives.sectionId],
    references: [farmSections.id],
  }),
  inspections: many(hiveInspections),
  harvests: many(hiveHarvests),
  swarms: many(hiveSwarms, { relationName: "swarmSource" }),
  caughtSwarms: many(hiveSwarms, { relationName: "swarmDest" }),
}));

export const hiveInspectionsRelations = relations(hiveInspections, ({ one }) => ({
  hive: one(hives, {
    fields: [hiveInspections.hiveId],
    references: [hives.id],
  }),
  inspector: one(users, {
    fields: [hiveInspections.inspectorId],
    references: [users.id],
  }),
}));

export const hiveHarvestsRelations = relations(hiveHarvests, ({ one }) => ({
  hive: one(hives, {
    fields: [hiveHarvests.hiveId],
    references: [hives.id],
  }),
  harvestedByUser: one(users, {
    fields: [hiveHarvests.harvestedBy],
    references: [users.id],
  }),
}));

export const hiveSwarmsRelations = relations(hiveSwarms, ({ one }) => ({
  hive: one(hives, {
    fields: [hiveSwarms.hiveId],
    references: [hives.id],
    relationName: "swarmSource",
  }),
  newHive: one(hives, {
    fields: [hiveSwarms.newHiveId],
    references: [hives.id],
    relationName: "swarmDest",
  }),
}));

export const poultryFlocksRelations = relations(poultryFlocks, ({ one, many }) => ({
  farm: one(farms, {
    fields: [poultryFlocks.farmId],
    references: [farms.id],
  }),
  section: one(farmSections, {
    fields: [poultryFlocks.sectionId],
    references: [farmSections.id],
  }),
  dailyRecords: many(poultryDailyRecords),
}));

export const poultryDailyRecordsRelations = relations(
  poultryDailyRecords,
  ({ one }) => ({
    flock: one(poultryFlocks, {
      fields: [poultryDailyRecords.flockId],
      references: [poultryFlocks.id],
    }),
    recordedByUser: one(users, {
      fields: [poultryDailyRecords.recordedBy],
      references: [users.id],
    }),
  })
);

export const cropPlotsRelations = relations(cropPlots, ({ one, many }) => ({
  farm: one(farms, { fields: [cropPlots.farmId], references: [farms.id] }),
  section: one(farmSections, {
    fields: [cropPlots.sectionId],
    references: [farmSections.id],
  }),
  seasons: many(cropSeasons),
}));

export const cropSeasonsRelations = relations(cropSeasons, ({ one, many }) => ({
  plot: one(cropPlots, {
    fields: [cropSeasons.plotId],
    references: [cropPlots.id],
  }),
  createdByUser: one(users, {
    fields: [cropSeasons.createdBy],
    references: [users.id],
  }),
  activities: many(cropActivities),
  harvests: many(cropHarvests),
}));

export const cropActivitiesRelations = relations(cropActivities, ({ one }) => ({
  season: one(cropSeasons, {
    fields: [cropActivities.seasonId],
    references: [cropSeasons.id],
  }),
  performedByUser: one(users, {
    fields: [cropActivities.performedBy],
    references: [users.id],
  }),
}));

export const cropHarvestsRelations = relations(cropHarvests, ({ one }) => ({
  season: one(cropSeasons, {
    fields: [cropHarvests.seasonId],
    references: [cropSeasons.id],
  }),
  harvestedByUser: one(users, {
    fields: [cropHarvests.harvestedBy],
    references: [users.id],
  }),
}));

export const diaryEntriesRelations = relations(diaryEntries, ({ one }) => ({
  farm: one(farms, {
    fields: [diaryEntries.farmId],
    references: [farms.id],
  }),
  author: one(users, {
    fields: [diaryEntries.authorId],
    references: [users.id],
  }),
}));

export const remindersRelations = relations(reminders, ({ one, many }) => ({
  farm: one(farms, { fields: [reminders.farmId], references: [farms.id] }),
  createdByUser: one(users, {
    fields: [reminders.createdBy],
    references: [users.id],
  }),
  notificationLogs: many(notificationLog),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
    notificationLogs: many(notificationLog),
  })
);

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  reminder: one(reminders, {
    fields: [notificationLog.reminderId],
    references: [reminders.id],
  }),
  subscription: one(pushSubscriptions, {
    fields: [notificationLog.subscriptionId],
    references: [pushSubscriptions.id],
  }),
}));

// ---------------------------------------------------------------------------
// TYPE EXPORTS
// (Inferred TypeScript types for use across the codebase)
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Farm = typeof farms.$inferSelect;
export type NewFarm = typeof farms.$inferInsert;

export type FarmMember = typeof farmMembers.$inferSelect;
export type NewFarmMember = typeof farmMembers.$inferInsert;

export type FarmSection = typeof farmSections.$inferSelect;
export type NewFarmSection = typeof farmSections.$inferInsert;

export type Livestock = typeof livestock.$inferSelect;
export type NewLivestock = typeof livestock.$inferInsert;

export type LivestockHealth = typeof livestockHealth.$inferSelect;
export type NewLivestockHealth = typeof livestockHealth.$inferInsert;

export type LivestockProduction = typeof livestockProduction.$inferSelect;
export type NewLivestockProduction = typeof livestockProduction.$inferInsert;

export type Hive = typeof hives.$inferSelect;
export type NewHive = typeof hives.$inferInsert;

export type HiveInspection = typeof hiveInspections.$inferSelect;
export type NewHiveInspection = typeof hiveInspections.$inferInsert;

export type HiveHarvest = typeof hiveHarvests.$inferSelect;
export type NewHiveHarvest = typeof hiveHarvests.$inferInsert;

export type HiveSwarm = typeof hiveSwarms.$inferSelect;
export type NewHiveSwarm = typeof hiveSwarms.$inferInsert;

export type PoultryFlock = typeof poultryFlocks.$inferSelect;
export type NewPoultryFlock = typeof poultryFlocks.$inferInsert;

export type PoultryDailyRecord = typeof poultryDailyRecords.$inferSelect;
export type NewPoultryDailyRecord = typeof poultryDailyRecords.$inferInsert;

export type CropPlot = typeof cropPlots.$inferSelect;
export type NewCropPlot = typeof cropPlots.$inferInsert;

export type CropSeason = typeof cropSeasons.$inferSelect;
export type NewCropSeason = typeof cropSeasons.$inferInsert;

export type CropActivity = typeof cropActivities.$inferSelect;
export type NewCropActivity = typeof cropActivities.$inferInsert;

export type CropHarvest = typeof cropHarvests.$inferSelect;
export type NewCropHarvest = typeof cropHarvests.$inferInsert;

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type NewDiaryEntry = typeof diaryEntries.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type NotificationLog = typeof notificationLog.$inferSelect;
export type NewNotificationLog = typeof notificationLog.$inferInsert;

export type QRCode = typeof qrCodes.$inferSelect;
export type NewQRCode = typeof qrCodes.$inferInsert;
