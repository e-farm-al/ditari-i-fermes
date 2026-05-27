/**
 * Farm Diary — Shared API Types
 * Used across all API routes for consistent request/response shapes.
 */

// ---------------------------------------------------------------------------
// RESPONSE ENVELOPE
// Every API route returns one of these two shapes.
// ---------------------------------------------------------------------------

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;     // machine-readable e.g. "FARM_NOT_FOUND"
    message: string;  // human-readable (can be shown in Albanian UI)
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ---------------------------------------------------------------------------
// PAGINATION
// ---------------------------------------------------------------------------

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type PaginationParams = {
  page?: number;      // 1-based, default 1
  pageSize?: number;  // default 20, max 100
};

// ---------------------------------------------------------------------------
// ERROR CODES
// Centralised so the frontend can switch on them.
// ---------------------------------------------------------------------------

export const API_ERRORS = {
  // Auth
  UNAUTHENTICATED:        "UNAUTHENTICATED",
  FORBIDDEN:              "FORBIDDEN",
  INSUFFICIENT_ROLE:      "INSUFFICIENT_ROLE",

  // Resource
  FARM_NOT_FOUND:         "FARM_NOT_FOUND",
  ANIMAL_NOT_FOUND:       "ANIMAL_NOT_FOUND",
  HIVE_NOT_FOUND:         "HIVE_NOT_FOUND",
  INSPECTION_NOT_FOUND:   "INSPECTION_NOT_FOUND",
  SWARM_NOT_FOUND:        "SWARM_NOT_FOUND",
  FLOCK_NOT_FOUND:        "FLOCK_NOT_FOUND",
  PLOT_NOT_FOUND:         "PLOT_NOT_FOUND",
  SEASON_NOT_FOUND:       "SEASON_NOT_FOUND",
  ENTRY_NOT_FOUND:        "ENTRY_NOT_FOUND",
  REMINDER_NOT_FOUND:     "REMINDER_NOT_FOUND",
  USER_NOT_FOUND:         "USER_NOT_FOUND",
  MEMBER_NOT_FOUND:       "MEMBER_NOT_FOUND",

  // Validation
  VALIDATION_ERROR:       "VALIDATION_ERROR",
  DUPLICATE_RECORD:       "DUPLICATE_RECORD",
  INVALID_DATE_RANGE:     "INVALID_DATE_RANGE",

  // Server
  INTERNAL_ERROR:         "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = typeof API_ERRORS[keyof typeof API_ERRORS];

// ---------------------------------------------------------------------------
// FARM MEMBER ROLES (mirrors DB enum — used for auth checks)
// ---------------------------------------------------------------------------

export type FarmRole = "owner" | "manager" | "worker" | "viewer";

// Which roles can perform write operations
export const WRITE_ROLES: FarmRole[] = ["owner", "manager", "worker"];
// Which roles can manage members and farm settings
export const ADMIN_ROLES: FarmRole[] = ["owner", "manager"];
// Only owner can delete the farm or transfer ownership
export const OWNER_ONLY: FarmRole[] = ["owner"];
