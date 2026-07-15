import { ApiDomainError } from "@/app/utils/apiDomainError.util";
import {
  PrefillField,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

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
    throw new ApiDomainError(
      "Une structure ne peut pas à la fois céder et recevoir des places dans une même transformation."
    );
  }
};

export const checkUniqueDepartement = (
  structureVersionTransformations: StructureVersionTransformationApiCreate[]
): void => {
  const departements = structureVersionTransformations
    .map(
      (structureVersionTransformation) =>
        structureVersionTransformation.structureVersion
          ?.departementAdministratif
    )
    .filter((departement): departement is string => departement != null);
  if (new Set(departements).size > 1) {
    throw new ApiDomainError(
      "Toutes les structures d'une transformation doivent appartenir au même département."
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
