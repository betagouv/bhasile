import { FormApiType } from "@/schemas/api/form.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

type StructureVersionTransformationApiReadItem =
  TransformationApiRead["structureVersionTransformations"][number];

export const createTransformationForm = ({
  id = 100,
  name = "structure-transformation-extension",
  status = false,
  validatedSlugs = [],
}: {
  id?: number;
  name?: string;
  status?: boolean;
  validatedSlugs?: string[];
} = {}): FormApiType => ({
  id,
  status,
  formDefinition: { id: 10, name, slug: `${name}-v1`, version: 1 },
  formSteps: [
    {
      id: 1001,
      status: validatedSlugs.includes("01-identification")
        ? StepStatus.VALIDE
        : StepStatus.NON_COMMENCE,
      stepDefinition: { id: 201, slug: "01-identification", label: "Description" },
    },
    {
      id: 1002,
      status: validatedSlugs.includes("02-places-hebergement")
        ? StepStatus.VALIDE
        : StepStatus.NON_COMMENCE,
      stepDefinition: {
        id: 202,
        slug: "02-places-hebergement",
        label: "Places et hébergement",
      },
    },
    {
      id: 1003,
      status: validatedSlugs.includes("03-actes-administratifs")
        ? StepStatus.VALIDE
        : StepStatus.NON_COMMENCE,
      stepDefinition: {
        id: 203,
        slug: "03-actes-administratifs",
        label: "Actes administratifs",
      },
    },
  ],
});

export const createTransformation = ({
  id = 42,
  type = TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  structureVersionTransformations = [],
}: {
  id?: number;
  type?: TransformationType;
  structureVersionTransformations?: TransformationApiRead["structureVersionTransformations"];
} = {}): TransformationApiRead => ({
  id,
  type,
  structureVersionTransformations,
});

export const createStructureVersionTransformation = ({
  id = 7,
  type = StructureVersionTransformationType.CREATION,
  ...overrides
}: Partial<StructureVersionTransformationApiReadItem> = {}): StructureVersionTransformationApiReadItem => ({
  id,
  type,
  ...overrides,
});
