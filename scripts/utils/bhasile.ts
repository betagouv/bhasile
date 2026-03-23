// Utils pour générer les codes Bhasile

import { REGIONS } from "@/constants";

const BHASILE_PREFIX = "BHA";

export function normalizeRegionCode(regionCode?: string | null): string | null {
  if (!regionCode) return null;
  return regionCode.replace(/^FR-/, "");
}

export function getNormalizedRegionCodeFromName(
  regionName?: string | null
): string | null {
  const regionCode = REGIONS.find((region) => region.name === regionName)?.code;
  return normalizeRegionCode(regionCode);
}

function formatBhasileCode(regionCode: string, counter: number): string {
  return `${BHASILE_PREFIX}-${regionCode}-${String(counter).padStart(3, "0")}`;
}

function extractCounterFromCode(
  regionCode: string,
  codeBhasile: string
): number | null {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const match = codeBhasile.match(
    new RegExp(`^${BHASILE_PREFIX}-${normalizedRegionCode}-(\\d{3})$`)
  );
  if (!match) return null;
  return parseInt(match[1]);
}

async function getLastBhasileCode(
  db: any,
  regionCode: string
): Promise<string | null> {
  const prefix = `${BHASILE_PREFIX}-${regionCode}-`;
  const lastStructure = await db.structure.findFirst({
    where: { codeBhasile: { startsWith: prefix } },
    orderBy: { codeBhasile: "desc" },
    select: { codeBhasile: true },
  });
  return lastStructure?.codeBhasile ?? null;
}

export async function getNextBhasileCode(
  db: any,
  regionCode: string,
  counterCache?: Map<string, number>
): Promise<string> {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const cachedCounter = counterCache?.get(normalizedRegionCode);
  if (cachedCounter != undefined) {
    const next = cachedCounter + 1;
    counterCache?.set(normalizedRegionCode, next);
    return formatBhasileCode(normalizedRegionCode, next);
  }

  const lastCode = await getLastBhasileCode(db, normalizedRegionCode);
  const lastCounter = lastCode
    ? extractCounterFromCode(normalizedRegionCode, lastCode)
    : null;
  const nextCounter = (lastCounter ?? 0) + 1;
  counterCache?.set(normalizedRegionCode, nextCounter);
  return formatBhasileCode(normalizedRegionCode, nextCounter);
}
