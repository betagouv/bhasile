/**
 * Shared utility functions for e2e tests
 */

import { Repartition } from "@/types/adresse.type";

/**
 * Parses an address string into its components
 */
export function parseAddressParts(fullAddress: string): {
  addressLine: string;
  postalCode: string;
  city: string;
} {
  const parsed = parseAddress(fullAddress);
  return {
    addressLine: parsed.street,
    postalCode: parsed.postalCode,
    city: parsed.city,
  };
}

/**
 * Parses an address string into its components (street, postal code, city, department)
 * This is the core parsing function used by other address utilities
 */
export function parseAddress(searchTerm: string): {
  street: string;
  postalCode: string;
  city: string;
  department: string;
} {
  const parts = searchTerm.trim().split(/\s+/);
  const postalCodeMatch = parts.find((part) => /^\d{5}$/.test(part));
  const postalCode = postalCodeMatch || "75001";
  const postalIndex = parts.findIndex((part) => part === postalCode);

  const city =
    postalIndex > -1 ? parts.slice(postalIndex + 1).join(" ") : "Paris";
  const street =
    postalIndex > -1
      ? parts.slice(0, postalIndex).join(" ") || "1 rue de Test"
      : searchTerm;

  // Extract department from postal code (first 2 digits for most, or "2A"/"2B" for Corsica)
  const department = postalCode.startsWith("20")
    ? postalCode.substring(0, 3) // Corsica: 201, 202, etc.
    : postalCode.substring(0, 2);

  return {
    street,
    postalCode,
    city,
    department,
  };
}

/**
 * Converts Repartition enum value to display label
 */
export function getRepartitionLabel(repartition: Repartition): string {
  switch (repartition) {
    case Repartition.COLLECTIF:
      return "Collectif";
    case Repartition.DIFFUS:
      return "Diffus";
    case Repartition.MIXTE:
      return "Mixte";
    default:
      return repartition;
  }
}

/**
 * Gets the accordion label for actes administratifs categories
 */
export function getActesCategoryLabel(category: string): string {
  switch (category) {
    case "ARRETE_AUTORISATION":
      return "Arrêtés d'autorisation";
    case "ARRETE_TARIFICATION":
      return "Arrêtés de tarification";
    case "CONVENTION":
      return "Conventions";
    case "CPOM":
      return "CPOM";
    case "AUTRE":
      return "Autres documents";
    default:
      return category;
  }
}

/**
 * Gets a RegExp for matching actes category labels (for locator filtering)
 */
export function getActesCategoryRegex(category: string): RegExp {
  return new RegExp(getActesCategoryLabel(category), "i");
}

/**
 * Normalizes document category labels (removes parenthetical suffixes)
 */
export function normalizeDocumentCategory(category: string): string {
  return category.replace(" (ou exécutoire)", "");
}

/**
 * Escapes special regex characters in a string
 */
export function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
