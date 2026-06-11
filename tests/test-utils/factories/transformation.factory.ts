import { FormApiType } from "@/schemas/api/form.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

type StructureVersionTransformationApiReadItem =
  TransformationApiRead["structureVersionTransformations"][number];

type StructureVersion = NonNullable<
  StructureVersionTransformationApiReadItem["structureVersion"]
>;

export const createTransformationForm = (
  name: string,
  steps: Array<{ slug: string; label: string; status?: StepStatus }>
): FormApiType => ({
  id: 100,
  status: steps.every((step) => step.status === StepStatus.VALIDE),
  formDefinition: { id: 10, name, slug: `${name}-v1`, version: 1 },
  formSteps: steps.map((step, index) => ({
    id: 1001 + index,
    status: step.status ?? StepStatus.NON_COMMENCE,
    stepDefinition: { id: 201 + index, slug: step.slug, label: step.label },
  })),
});

export const createStandardTransformationForm = (name: string): FormApiType =>
  createTransformationForm(name, [
    { slug: "01-identification", label: "Description" },
    { slug: "02-places-hebergement", label: "Places et hébergement" },
    { slug: "03-actes-administratifs", label: "Actes administratifs" },
  ]);

export const completeIdentificationStructureVersion = (
  overrides: { creationDate?: string; effectiveDate?: string; nom?: string } = {}
): StructureVersion =>
  ({
    id: 999,
    nom: "Les Coquelicots",
    type: "CADA",
    adresseAdministrative: "12 rue des Lilas",
    adresseAdministrativeComplete: "12 rue des Lilas 75011 Paris",
    codePostalAdministratif: "75011",
    communeAdministrative: "Paris",
    departementAdministratif: "75",
    antennes: [],
    dnaStructures: [{ dna: { code: "ABC123" } }],
    finesses: [],
    contacts: [
      {
        prenom: "Jean",
        nom: "Dupont",
        role: "Directeur",
        telephone: "0600000000",
        email: "jean@example.com",
      },
    ],
    ...overrides,
  }) as unknown as StructureVersion;

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
