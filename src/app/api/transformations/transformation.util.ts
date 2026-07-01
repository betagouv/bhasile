import {
  PrefillField,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureVersionTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

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
