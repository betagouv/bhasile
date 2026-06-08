import {
  PrefillField,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { TransformationType } from "@/types/transformation.type";

export const applyPrefill = (
  transformationType: TransformationType,
  structureTransformations: StructureTransformationApiCreate[]
): StructureTransformationApiCreate[] => {
  const rules = TRANSFORMATION_TYPE_SPECS[transformationType].prefill ?? [];
  if (rules.length === 0) {
    return structureTransformations;
  }

  return structureTransformations.map((structureTransformation) => {
    const applicableRules = rules.filter(
      (rule) => rule.to === structureTransformation.type
    );
    if (applicableRules.length === 0) {
      return structureTransformation;
    }

    let structureVersion: StructureVersionApiType = {
      ...structureTransformation.structureVersion,
    };
    for (const rule of applicableRules) {
      const sources = structureTransformations.filter(
        (candidate) => candidate.type === rule.from
      );
      structureVersion = appendPrefillFields(
        structureVersion,
        sources,
        rule.fields
      );
    }

    return { ...structureTransformation, structureVersion };
  });
};

const appendPrefillFields = (
  version: StructureVersionApiType,
  sources: StructureTransformationApiCreate[],
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
