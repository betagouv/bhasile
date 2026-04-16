import { REGIONS } from "@/constants";

const PREFIX = "BHA";

const generateBhasileCodesForRegion = (
  regionCode: string,
  count: number
): string[] => {
  return Array.from({ length: count }, (_, index) => {
    const counter = (index + 1).toString().padStart(3, "0");
    const cleanedRegionCode = regionCode.replace("-FR", "");
    return `${PREFIX}-${cleanedRegionCode}-${counter}`;
  });
};

export const generateAllBhasileCodes = (
  codesPerRegion: number = 200
): Map<string, string[]> => {
  const codesMap = new Map<string, string[]>();

  for (const region of REGIONS) {
    const codes = generateBhasileCodesForRegion(region.code, codesPerRegion);
    codesMap.set(region.name, codes);
  }

  return codesMap;
};

export const getNextBhasileCode = (
  codesMap: Map<string, string[]>,
  region: string
): string | null => {
  const codes = codesMap.get(region);
  if (!codes || codes.length === 0) {
    return null;
  }
  return codes.shift() || null;
};
