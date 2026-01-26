import { REGION_CODES } from "@/app/utils/bhasileCode.util";

const PREFIX = "BHA";

/**
 * Génère un array de codes Bhasile pour une région donnée
 * @param regionCode Code de la région (ex: "OCC")
 * @param count Nombre de codes à générer
 * @returns Array de codes Bhasile (ex: ["BHA-OCC-001", "BHA-OCC-002", ...])
 */
export const generateBhasileCodesForRegion = (
  regionCode: string,
  count: number
): string[] => {
  return Array.from({ length: count }, (_, index) => {
    const counter = (index + 1).toString().padStart(3, "0");
    return `${PREFIX}-${regionCode}-${counter}`;
  });
};

/**
 * Génère tous les codes Bhasile par région
 * @param codesPerRegion Nombre de codes à générer par région
 * @returns Map avec région -> array de codes Bhasile
 */
export const generateAllBhasileCodes = (
  codesPerRegion: number = 200
): Map<keyof typeof REGION_CODES, string[]> => {
  const codesMap = new Map<keyof typeof REGION_CODES, string[]>();

  for (const [regionName, regionCode] of Object.entries(REGION_CODES)) {
    const codes = generateBhasileCodesForRegion(
      regionCode,
      codesPerRegion
    );
    codesMap.set(regionName as keyof typeof REGION_CODES, codes);
  }

  return codesMap;
};

/**
 * Récupère le prochain code Bhasile disponible pour une région
 * @param codesMap Map des codes par région
 * @param region Nom de la région
 * @returns Le prochain code disponible ou null si épuisé
 */
export const getNextBhasileCode = (
  codesMap: Map<keyof typeof REGION_CODES, string[]>,
  region: keyof typeof REGION_CODES
): string | null => {
  const codes = codesMap.get(region);
  if (!codes || codes.length === 0) return null;
  return codes.shift() || null;
};

