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
  const parts = fullAddress.trim().split(/\s+/);
  const postalCodeMatch = parts.find((part) => /^\d{5}$/.test(part));
  const postalCode = postalCodeMatch || "";
  const postalIndex = parts.findIndex((part) => part === postalCode);
  const city = postalIndex > -1 ? parts.slice(postalIndex + 1).join(" ") : "";
  const addressLine =
    postalIndex > -1 ? parts.slice(0, postalIndex).join(" ") : fullAddress;
  return { addressLine, postalCode, city };
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
