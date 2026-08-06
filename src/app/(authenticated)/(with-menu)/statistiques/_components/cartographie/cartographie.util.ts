import { DEPARTEMENTS, REGIONS } from "@/constants";
import { CartographieZoneStat } from "@/schemas/api/statistique-cartographie.schema";
import { ZoneDataInfo } from "@/types/map.type";

export const cleanZoneCode = (code: string): string => code.replace(/^FR-/, "");

export const zonesToValueRecord = (
  zones: CartographieZoneStat[]
): Record<string, number> =>
  zones.reduce<Record<string, number>>((accumulator, zone) => {
    if (zone.value !== null) {
      accumulator[cleanZoneCode(zone.code)] = zone.value;
    }
    return accumulator;
  }, {});

export const zonesToRichRecord = (
  zones: CartographieZoneStat[]
): Record<string, ZoneDataInfo> =>
  zones.reduce<Record<string, ZoneDataInfo>>((accumulator, zone) => {
    if (zone.value !== null) {
      accumulator[cleanZoneCode(zone.code)] = {
        value: zone.value,
        delta: zone.evolution?.delta,
        direction: zone.evolution?.direction,
      };
    }
    return accumulator;
  }, {});

export const richRecordToValueRecord = (
  richRecord: Record<string, ZoneDataInfo>
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(richRecord).map(([code, info]) => [code, info.value])
  );

export const getDepartementNumerosForRegion = (regionCode: string): string[] => {
  const region = REGIONS.find((r) => cleanZoneCode(r.code) === regionCode);
  if (!region) {
    return [];
  }
  return DEPARTEMENTS.filter((departement) => departement.region === region.name).map(
    (departement) => departement.numero
  );
};
