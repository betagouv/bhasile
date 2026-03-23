// Utils pour générer les codes Bhasile

import { REGIONS } from "@/constants";

const BHASILE_PREFIX = "BHA";

type BhasileDbClient = {
  structure: {
    findFirst: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any>;
  };
};

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

export function formatBhasileCode(regionCode: string, counter: number): string {
  return `${BHASILE_PREFIX}-${regionCode}-${String(counter).padStart(3, "0")}`;
}

export function extractCounterFromCode(
  regionCode: string,
  codeBhasile: string
): number | null {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const match = codeBhasile.match(
    new RegExp(`^${BHASILE_PREFIX}-${normalizedRegionCode}-(\\d{3})$`)
  );
  if (!match) return null;
  return parseInt(match[1], 10);
}

export async function getLastBhasileCodeForRegion(
  db: BhasileDbClient,
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

export async function generateBhasileCodeForRegion(
  db: BhasileDbClient,
  regionCode: string
): Promise<string> {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const lastCode = await getLastBhasileCodeForRegion(db, normalizedRegionCode);
  const lastCounter = lastCode
    ? extractCounterFromCode(normalizedRegionCode, lastCode)
    : null;
  const nextCounter = (lastCounter ?? 0) + 1;
  return formatBhasileCode(normalizedRegionCode, nextCounter);
}

export async function getMaxBhasileCounterForRegion(
  db: BhasileDbClient,
  regionCode: string
): Promise<number> {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const prefix = `${BHASILE_PREFIX}-${normalizedRegionCode}-`;
  const structures = await db.structure.findMany({
    where: { codeBhasile: { startsWith: prefix } },
    select: { codeBhasile: true },
  });

  let maxCounter = 0;
  for (const structure of structures) {
    const counter = structure.codeBhasile
      ? extractCounterFromCode(normalizedRegionCode, structure.codeBhasile)
      : null;
    if ((counter ?? 0) > maxCounter) {
      maxCounter = counter ?? 0;
    }
  }

  return maxCounter;
}

export async function generateNextBhasileCode(
  db: BhasileDbClient,
  regionCode: string,
  regionCounterCache: Map<string, number>
): Promise<string> {
  const normalizedRegionCode = normalizeRegionCode(regionCode) ?? regionCode;
  const cachedCounter = regionCounterCache.get(normalizedRegionCode);

  if (cachedCounter == undefined) {
    const maxCounter = await getMaxBhasileCounterForRegion(
      db,
      normalizedRegionCode
    );
    const next = maxCounter + 1;
    regionCounterCache.set(normalizedRegionCode, next);
    return formatBhasileCode(normalizedRegionCode, next);
  }

  const next = cachedCounter + 1;
  regionCounterCache.set(normalizedRegionCode, next);
  return formatBhasileCode(normalizedRegionCode, next);
}
