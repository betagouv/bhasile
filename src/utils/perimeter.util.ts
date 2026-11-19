import { GrantScope } from "@/generated/prisma/enums";
import { PerimeterRead, ZoneOption } from "@/types/agent.type";

export const toZoneKey = (scope: GrantScope, id: string | number): string =>
  `${scope}:${id}`;

export const getDefaultPerimeterName = (zone: ZoneOption): string =>
  `${zone.scope === GrantScope.DEPARTEMENT ? "DDETS" : "DREETS"} ${zone.name}`;

export const findPerimetersInZone = (
  perimeters: PerimeterRead[],
  zone: ZoneOption
): PerimeterRead[] =>
  perimeters.filter(
    ({ zoneKey }) => zoneKey === toZoneKey(zone.scope, zone.id)
  );
