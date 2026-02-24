import { REGION_CODES } from "@/app/utils/bhasileCode.util";

const PREFIX = "BHA";

export const generateBhasileCodesForRegion = (
  regionCode: string,
  count: number
): string[] => {
  return Array.from({ length: count }, (_, index) => {
    const counter = (index + 1).toString().padStart(3, "0");
    return `${PREFIX}-${regionCode}-${counter}`;
  });
};

export const generateAllBhasileCodes = (
  codesPerRegion: number = 200
): Map<keyof typeof REGION_CODES, string[]> => {
  const codesMap = new Map<keyof typeof REGION_CODES, string[]>();

  for (const [regionName, regionCode] of Object.entries(REGION_CODES)) {
    const codes = generateBhasileCodesForRegion(regionCode, codesPerRegion);
    codesMap.set(regionName as keyof typeof REGION_CODES, codes);
  }

  return codesMap;
};

export const getNextBhasileCode = (
  codesMap: Map<keyof typeof REGION_CODES, string[]>,
  region: keyof typeof REGION_CODES
): string | null => {
  const codes = codesMap.get(region);
  if (!codes || codes.length === 0) return null;
  return codes.shift() || null;
};

export const REGION_CODES_ARRAY = Object.keys(
  REGION_CODES
) as (keyof typeof REGION_CODES)[];
