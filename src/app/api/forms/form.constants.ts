import { StructureVersionTransformationType } from "@/generated/prisma/enums";

export const FINALISATION_FORM_SLUG = "finalisation-v1";

export const TRANSFORMATION_FORM_SLUG = "transformation-v1";

export const ACTUALISATION_FORM_SLUG = "actualisation-v1";

export const STRUCTURE_VERSION_TRANSFORMATION_FORM_SLUGS: Record<
  StructureVersionTransformationType,
  string
> = {
  [StructureVersionTransformationType.CREATION]:
    "structure-transformation-creation-v1",
  [StructureVersionTransformationType.EXTENSION]:
    "structure-transformation-extension-v1",
  [StructureVersionTransformationType.CONTRACTION]:
    "structure-transformation-contraction-v1",
  [StructureVersionTransformationType.FERMETURE]:
    "structure-transformation-fermeture-v1",
};
