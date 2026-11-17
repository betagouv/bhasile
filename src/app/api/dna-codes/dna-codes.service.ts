import { FreeDnaCode, FreeDnaCodeFilters } from "@/types/dna.type";
import { EntityId } from "@/types/Entity.type";

import { findAll } from "./dna-codes.repository";

const CORSE_DEPARTEMENTS = ["20", "2A", "2B"];

export const getDnaCodes = async ({
  entityId = {},
  transformationId,
  operateurId,
  departementAdministratif,
  type,
}: FreeDnaCodeFilters & {
  entityId?: EntityId;
  transformationId?: number;
}): Promise<FreeDnaCode[]> => {
  return findAll({
    entityId,
    transformationId,
    operateurId,
    departementsAdministratifs: getDepartementsAdministratifs(
      departementAdministratif
    ),
    type,
  });
};

// Un code postal corse saisi à la main donne « 20 », alors que le référentiel OFII range ses DNA en 2A/2B.
const getDepartementsAdministratifs = (
  departementAdministratif?: string
): string[] | undefined => {
  if (!departementAdministratif) {
    return undefined;
  }
  if (CORSE_DEPARTEMENTS.includes(departementAdministratif)) {
    return CORSE_DEPARTEMENTS;
  }
  return [departementAdministratif];
};
