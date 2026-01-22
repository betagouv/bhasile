/**
 * E2E test constants
 */

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

export const TIMEOUTS = {
  /** Default timeout for page navigation */
  NAVIGATION: 10000,
  /** Timeout for form submissions */
  SUBMIT: 15000,
  /** Timeout for autocomplete suggestions */
  AUTOCOMPLETE: 5000,
  /** Short wait for UI updates */
  UI_UPDATE: 500,
  /** Very short wait for quick UI updates (e.g., panel animations) */
  SHORT_UI_UPDATE: 300,
  /** Medium wait for UI updates (e.g., page load verification) */
  MEDIUM_UI_UPDATE: 1000,
} as const;

export const URLS = {
  STRUCTURES: `${BASE_URL}/structures`,
  AJOUT_STRUCTURE: `${BASE_URL}/ajout-structure`,
  ajoutStep: (dnaCode: string, step: string) =>
    `${BASE_URL}/ajout-structure/${dnaCode}/${step}`,
  finalisationStep: (structureId: number, step: string) =>
    `${BASE_URL}/structures/${structureId}/finalisation/${step}`,
  structure: (structureId: number) => `${BASE_URL}/structures/${structureId}`,
} as const;
