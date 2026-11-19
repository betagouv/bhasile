import { DomainError } from "@/app/utils/domain-error.util";
import { GrantScope } from "@/generated/prisma/enums";
import { PerimeterApiCreate } from "@/schemas/api/perimeter.schema";
import { PerimeterRead, ZoneOption } from "@/types/agent.type";
import { toZoneKey } from "@/utils/perimeter.util";

import {
  createPerimeter,
  findPerimeterById,
  findPerimeterIdByName,
  findPerimeters,
  findZones,
} from "./perimeter.repository";

export const getPerimeters = async (): Promise<PerimeterRead[]> =>
  (await findPerimeters()).map(({ id, name, grants }) => {
    const [grant] = grants;
    if (grant?.scope === GrantScope.DEPARTEMENT && grant.departementNumero) {
      return {
        id,
        name,
        zoneKey: toZoneKey(grant.scope, grant.departementNumero),
        zoneLabel: `${grant.departementNumero} – ${grant.departement?.name ?? ""}`,
      };
    }
    if (grant?.scope === GrantScope.REGION && grant.regionId) {
      return {
        id,
        name,
        zoneKey: toZoneKey(grant.scope, grant.regionId),
        zoneLabel: grant.region?.name ?? "",
      };
    }
    return { id, name, zoneKey: null, zoneLabel: "National" };
  });

export const getZoneOptions = async (): Promise<ZoneOption[]> => {
  const { departements, regions } = await findZones();
  return [
    ...departements.map(({ numero, name }) => ({
      scope: GrantScope.DEPARTEMENT,
      id: numero,
      name,
    })),
    ...regions.map(({ id, name }) => ({
      scope: GrantScope.REGION,
      id: String(id),
      name,
    })),
  ];
};

export const addPerimeter = async (
  input: PerimeterApiCreate
): Promise<{ id: number }> => {
  if (await findPerimeterIdByName(input.name)) {
    throw new DomainError(`Un périmètre s’appelle déjà « ${input.name} »`, 409);
  }
  return createPerimeter(input);
};

export const getPerimeterOrThrow = async (id: number) => {
  const perimeter = await findPerimeterById(id);
  if (!perimeter) {
    throw new DomainError("Périmètre introuvable", 404);
  }
  return perimeter;
};
