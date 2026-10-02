import { DomainError } from "@/app/utils/domainError.util";
import {
  getStructureVersionTransformationDepartement,
  isEffectiveDateValid,
} from "@/app/utils/transformation.util";
import {
  PrefillField,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import {
  AppAbility,
  canAbilityUpdateDepartement,
  defineAbilityFor,
} from "@/lib/casl/abilities";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import {
  StructureVersionTransformationApiCreate,
  StructureVersionTransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";
import {
  DepartementBearingStructureVersionTransformation,
  TransformationType,
} from "@/types/transformation.type";

export const checkNoDuplicateStructureIds = (
  structureVersionTransformations: StructureVersionTransformationApiCreate[]
): void => {
  const structureIds = structureVersionTransformations
    .map(
      (structureVersionTransformation) =>
        structureVersionTransformation.structureVersion?.structureId
    )
    .filter((structureId): structureId is number => structureId != null);
  if (new Set(structureIds).size !== structureIds.length) {
    throw new DomainError(
      "Une structure ne peut pas à la fois céder et recevoir des places dans une même transformation."
    );
  }
};

const collectDepartements = (
  structureVersionTransformations: DepartementBearingStructureVersionTransformation[]
): string[] =>
  structureVersionTransformations
    .map(getStructureVersionTransformationDepartement)
    .filter((departement): departement is string => Boolean(departement));

const findRefusedDepartement = (
  ability: AppAbility,
  structureVersionTransformations: DepartementBearingStructureVersionTransformation[]
): string | undefined =>
  collectDepartements(structureVersionTransformations).find(
    (departement) => !canAbilityUpdateDepartement(ability, departement)
  );

export const canUpdateTransformationDepartements = (
  ability: AppAbility,
  structureVersionTransformations: DepartementBearingStructureVersionTransformation[]
): boolean =>
  ability.can("update", "Structure") &&
  !findRefusedDepartement(ability, structureVersionTransformations);

export const isTransformationVisible = (
  ability: AppAbility,
  structureVersionTransformations: DepartementBearingStructureVersionTransformation[]
): boolean => {
  const departements = collectDepartements(structureVersionTransformations);
  return (
    departements.length === 0 ||
    departements.some((departement) =>
      canAbilityUpdateDepartement(ability, departement)
    )
  );
};

export const checkCanUpdateDepartements = (
  user: SessionUser | undefined,
  structureVersionTransformations: DepartementBearingStructureVersionTransformation[]
): void => {
  if (!user) {
    return;
  }

  const ability = defineAbilityFor(user);
  if (!ability.can("update", "Structure")) {
    throw new DomainError("Droits insuffisants", 403);
  }

  const refusedDepartement = findRefusedDepartement(
    ability,
    structureVersionTransformations
  );
  if (refusedDepartement) {
    throw new DomainError(
      `Le département ${refusedDepartement} n'est pas dans votre périmètre.`,
      403
    );
  }
};

export const checkEffectiveDatesAreValid = (
  structureVersionTransformations: StructureVersionTransformationApiUpdate[]
): void => {
  const hasInvalidEffectiveDate = structureVersionTransformations.some(
    (structureVersionTransformation) => {
      const effectiveDate =
        structureVersionTransformation.structureVersion?.effectiveDate;
      return effectiveDate != null && !isEffectiveDateValid(effectiveDate);
    }
  );
  if (hasInvalidEffectiveDate) {
    throw new DomainError(
      `Il n'est pas possible de déclarer une date d'effet antérieure à ${PLACES_VERSIONED_FROM_YEAR} sur Bhasile`
    );
  }
};

export const applyPrefill = (
  transformationType: TransformationType,
  structureVersionTransformations: StructureVersionTransformationApiCreate[]
): StructureVersionTransformationApiCreate[] => {
  const rules = TRANSFORMATION_TYPE_SPECS[transformationType].prefill ?? [];
  if (rules.length === 0) {
    return structureVersionTransformations;
  }

  return structureVersionTransformations.map(
    (structureVersionTransformation) => {
      const applicableRules = rules.filter(
        (rule) => rule.to === structureVersionTransformation.type
      );
      if (applicableRules.length === 0) {
        return structureVersionTransformation;
      }

      let structureVersion: StructureVersionApiType = {
        ...structureVersionTransformation.structureVersion,
      };
      let operateurId = structureVersionTransformation.operateurId;
      for (const rule of applicableRules) {
        const sources = structureVersionTransformations.filter(
          (candidate) => candidate.type === rule.from
        );
        structureVersion = appendPrefillFields(
          structureVersion,
          sources,
          rule.fields
        );
        if (rule.fields.includes("operateur")) {
          operateurId = sources[0]?.operateurId ?? operateurId;
        }
      }

      return {
        ...structureVersionTransformation,
        operateurId,
        structureVersion,
      };
    }
  );
};

const appendPrefillFields = (
  version: StructureVersionApiType,
  sources: StructureVersionTransformationApiCreate[],
  fields: PrefillField[]
): StructureVersionApiType => {
  let result = version;

  if (fields.includes("contacts")) {
    result = {
      ...result,
      contacts: [
        ...(result.contacts ?? []),
        ...sources.flatMap((source) => source.structureVersion?.contacts ?? []),
      ],
    };
  }
  if (fields.includes("antennes")) {
    result = {
      ...result,
      antennes: [
        ...(result.antennes ?? []),
        ...sources.flatMap((source) => source.structureVersion?.antennes ?? []),
      ],
    };
  }
  if (fields.includes("adresses")) {
    result = {
      ...result,
      adresses: [
        ...(result.adresses ?? []),
        ...sources.flatMap((source) => source.structureVersion?.adresses ?? []),
      ],
    };
  }

  return result;
};
