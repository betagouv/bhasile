import { fakerFR as faker } from "@faker-js/faker";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import {
  ActeAdministratifCategory,
  Prisma,
  PublicType,
  StepStatus,
  StructureVersionTransformationType,
  TransformationType,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { createFakeActeAdministratif } from "./acte-administratif.seed";
import { createFakeAdresses } from "./adresse.seed";
import { createFakeBudget } from "./budget.seed";
import { createFakeContact } from "./contact.seed";
import { createFakeControle } from "./controle.seed";
import { createFakeDocumentFinancier } from "./document-financier";
import { createFakeEvaluation } from "./evaluation.seed";
import { createFakeFileUpload } from "./file-upload.seed";
import { createFakeFormWithSteps } from "./form.seed";
import { createFakeIndicateurFinancier } from "./indicateur-financier";
import { createFakeStructureTypologie } from "./structure-typologie.seed";

export type FormDefInfo = { id: number; stepDefinitionIds: number[] };
export type FormDefLookup = Map<string, FormDefInfo>;

export type Coordinates = { latitude: number; longitude: number };

export type FileUploadPlan = ReturnType<typeof createFakeFileUpload>;

// La ligne à insérer et ses pièces jointes restent séparées : les fichiers sont
// écrits dans un second temps, une fois l'identifiant du parent connu.
export type WithFileUploads<TRow> = {
  row: TRow;
  fileUploads: FileUploadPlan[];
};

const splitFileUploads = <TEntity extends { fileUploads: FileUploadPlan[] }>(
  entity: TEntity
): WithFileUploads<Omit<TEntity, "fileUploads">> => {
  const { fileUploads, ...row } = entity;
  return { row, fileUploads };
};

export type FormPlan = {
  form: Omit<Prisma.FormCreateManyInput, "id">;
  formSteps: Omit<Prisma.FormStepCreateManyInput, "id" | "formId">[];
};

export type ActePlan = WithFileUploads<
  Omit<Prisma.ActeAdministratifCreateManyInput, "id">
>;

export type DocumentFinancierPlan = WithFileUploads<
  Omit<Prisma.DocumentFinancierCreateManyInput, "id">
>;

export type ControlePlan = WithFileUploads<
  Omit<Prisma.ControleCreateManyInput, "id">
>;

export type EvaluationPlan = WithFileUploads<
  Omit<Prisma.EvaluationCreateManyInput, "id">
>;

export type TransformationPlan = {
  type: TransformationType;
  form: FormPlan;
  structureVersionTransformation: Omit<
    Prisma.StructureVersionTransformationCreateManyInput,
    "id" | "transformationId"
  >;
  actes: ActePlan[];
  structureVersionTransformationForm: FormPlan;
};

export type VersionPlan = {
  version: Omit<
    Prisma.StructureVersionCreateManyInput,
    "id" | "structureId" | "structureVersionTransformationId"
  >;
  contacts: Omit<Prisma.ContactCreateManyInput, "id" | "structureVersionId">[];
  adresses: Omit<Prisma.AdresseCreateManyInput, "id" | "structureVersionId">[];
  transformation: TransformationPlan | null;
};

export type StructureRelationsPlan = {
  actes: ActePlan[];
  documentsFinanciers: DocumentFinancierPlan[];
  forms: FormPlan[];
  typologies: Omit<
    Prisma.StructureTypologieCreateManyInput,
    "id" | "structureId"
  >[];
  budgets: Omit<Prisma.BudgetCreateManyInput, "id" | "structureId">[];
  indicateursFinanciers: Omit<
    Prisma.IndicateurFinancierCreateManyInput,
    "id" | "structureId"
  >[];
  controles: ControlePlan[];
  evaluations: EvaluationPlan[];
};

export type StructurePlan = {
  structure: Omit<Prisma.StructureCreateManyInput, "id">;
  relations: StructureRelationsPlan | null;
  versions: VersionPlan[];
  currentVersionIndex: number;
};

const STRUCTURE_ZONE = {
  minLatitude: 43.550851,
  maxLatitude: 49.131627,
  minLongitude: -0.851371,
  maxLongitude: 5.843377,
};

export const COLOCATED_COORDINATES: Coordinates = {
  latitude: STRUCTURE_ZONE.maxLatitude - 0.05,
  longitude: STRUCTURE_ZONE.minLongitude + 0.05,
};

export const COLOCATED_STRUCTURES_COUNT = 4;

export type SeedStructureParams = {
  operateurId: number;
  filiale: string | null;
  codeBhasile: string;
  departementAdministratif: string;
  type: StructureType;
  ofii: boolean;
  isFinalised: boolean;
  now: Date;
  formDefs: FormDefLookup;
  finalisationFormDefId: number;
  finalisationStepDefinitions: { id: number; slug: string }[];
  coordinates?: Coordinates;
};

export type SeededStructure = { structureId: number; currentVersionId: number };

type TransfoKind = "EXTENSION" | "CONTRACTION" | "FERMETURE";

type VersionSpec =
  | { provenance: "INITIALE"; effectiveDate: Date; places: number }
  | { provenance: "CREATION"; effectiveDate: Date; places: number }
  | {
      provenance: "TRANSFO";
      transfoType: TransfoKind;
      effectiveDate: Date;
      places: number;
    };

type StructureHistoryPlan = {
  creationDate: Date;
  versions: VersionSpec[];
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const pickNbTransfos = (): number =>
  faker.helpers.weightedArrayElement([
    { weight: 40, value: 0 },
    { weight: 30, value: 1 },
    { weight: 20, value: 2 },
    { weight: 10, value: 3 },
  ]);

const planStructureHistory = (
  ofii: boolean,
  now: Date
): StructureHistoryPlan => {
  const creationDate = addMonths(now, -faker.number.int({ min: 12, max: 120 }));

  if (ofii) {
    return {
      creationDate,
      versions: [
        { provenance: "INITIALE", effectiveDate: creationDate, places: 0 },
      ],
    };
  }

  const startsByCreationTranformation = faker.datatype.boolean({
    probability: 0.1,
  });
  let places = faker.number.int({ min: 20, max: 150 });
  const versions: VersionSpec[] = [
    startsByCreationTranformation
      ? { provenance: "CREATION", effectiveDate: creationDate, places }
      : { provenance: "INITIALE", effectiveDate: creationDate, places },
  ];

  const nbTransfos = pickNbTransfos();
  const endsWithFermeture =
    nbTransfos > 0 && faker.datatype.boolean({ probability: 0.2 });
  const endsInFuture =
    nbTransfos > 0 && faker.datatype.boolean({ probability: 0.27 });

  const versionRegimeStart = new Date(
    Date.UTC(PLACES_VERSIONED_FROM_YEAR, 0, 1)
  );
  let cursor =
    creationDate > versionRegimeStart ? creationDate : versionRegimeStart;
  for (let index = 0; index < nbTransfos; index++) {
    const isLast = index === nbTransfos - 1;

    let transfoType: TransfoKind;
    if (isLast && endsWithFermeture) {
      transfoType = "FERMETURE";
    } else if (places <= 10) {
      transfoType = "EXTENSION";
    } else {
      transfoType = faker.helpers.arrayElement<TransfoKind>([
        "EXTENSION",
        "CONTRACTION",
      ]);
    }

    // EXTENSION/CONTRACTION changent le nombre de places ; une FERMETURE ne le
    // change pas l'année où elle survient (les années suivantes tombent à zéro
    // au calcul des typologies).
    if (transfoType === "EXTENSION") {
      places += faker.number.int({ min: 5, max: 50 });
    } else if (transfoType === "CONTRACTION") {
      places = Math.max(
        1,
        places - faker.number.int({ min: 1, max: places - 1 })
      );
    }

    cursor = addMonths(cursor, faker.number.int({ min: 6, max: 24 }));
    let effectiveDate = cursor;

    const previousDate = versions[versions.length - 1].effectiveDate;
    if (isLast && endsInFuture) {
      const future = addMonths(now, faker.number.int({ min: 1, max: 18 }));
      effectiveDate =
        future > previousDate ? future : addDays(previousDate, 30);
      cursor = effectiveDate;
    }

    versions.push({
      provenance: "TRANSFO",
      transfoType,
      effectiveDate,
      places,
    });
  }

  return { creationDate, versions };
};

type VersionScalars = {
  nom: string;
  nomOfii: string;
  departementAdministratif: string;
  directionTerritoriale: string;
  adresseAdministrative?: string | null;
  codePostalAdministratif?: string | null;
  communeAdministrative?: string | null;
  latitude?: Prisma.Decimal | null;
  longitude?: Prisma.Decimal | null;
  public?: PublicType | null;
  notes?: string | null;
};

const buildVersionScalars = (
  departementAdministratif: string,
  ofii: boolean,
  coordinates?: Coordinates
): VersionScalars => {
  const base: VersionScalars = {
    nom: faker.lorem.words(2),
    nomOfii: faker.lorem.words(2),
    departementAdministratif,
    directionTerritoriale: "DT " + faker.location.city(),
  };

  if (ofii) {
    return base;
  }

  return {
    ...base,
    adresseAdministrative: faker.location.streetAddress(),
    communeAdministrative: faker.location.city(),
    codePostalAdministratif: faker.location.zipCode(),
    latitude: new Prisma.Decimal(
      coordinates?.latitude ??
        faker.location.latitude({
          min: STRUCTURE_ZONE.minLatitude,
          max: STRUCTURE_ZONE.maxLatitude,
        })
    ),
    longitude: new Prisma.Decimal(
      coordinates?.longitude ??
        faker.location.longitude({
          min: STRUCTURE_ZONE.minLongitude,
          max: STRUCTURE_ZONE.maxLongitude,
        })
    ),
    public: faker.helpers.enumValue(PublicType),
    notes: faker.lorem.lines(2),
  };
};

type StableContacts = ReturnType<typeof createFakeContact>[];

type TypologieSpec = { year: number; placesAutorisees: number };

const buildTypologieSpecs = (
  timeline: VersionSpec[],
  creationDate: Date,
  now: Date
): TypologieSpec[] => {
  const startYear = creationDate.getFullYear();
  const lastVersion = timeline[timeline.length - 1];
  const endYear = Math.max(
    now.getFullYear(),
    lastVersion.effectiveDate.getFullYear()
  );

  const specs: TypologieSpec[] = [];
  for (let year = startYear; year <= endYear; year++) {
    let placesAutorisees = timeline[0].places;
    for (const version of timeline) {
      const versionYear = version.effectiveDate.getFullYear();
      if (versionYear > year) {
        continue;
      }

      const isClosedBefore =
        version.provenance === "TRANSFO" &&
        version.transfoType === "FERMETURE" &&
        versionYear < year;
      placesAutorisees = isClosedBefore ? 0 : version.places;
    }
    specs.push({ year, placesAutorisees });
  }
  return specs;
};

const acteWithCategory = (
  category: ActeAdministratifCategory,
  startDate: Date,
  endDate: Date
): ActePlan => {
  const { fileUploads, ...acte } = createFakeActeAdministratif();
  return { row: { ...acte, category, startDate, endDate }, fileUploads };
};

const buildStructureLevelActes = (creationDate: Date): ActePlan[] => [
  acteWithCategory(
    "CONVENTION",
    creationDate,
    addMonths(creationDate, faker.number.int({ min: 48, max: 120 }))
  ),
  acteWithCategory(
    "ARRETE_AUTORISATION",
    creationDate,
    addMonths(creationDate, faker.number.int({ min: 120, max: 240 }))
  ),
  acteWithCategory(
    "ARRETE_TARIFICATION",
    addMonths(creationDate, 6),
    addMonths(creationDate, 18)
  ),
  ...Array.from({ length: 2 }, () =>
    acteWithCategory("AUTRE", faker.date.past(), faker.date.future())
  ),
];

const TRANSFO_ACTE_CATEGORIES: Record<
  StructureVersionTransformationType,
  ActeAdministratifCategory[]
> = {
  CREATION: [
    "ARRETE_AUTORISATION",
    "CONVENTION",
    "ARRETE_TARIFICATION",
    "AUTRE",
  ],
  EXTENSION: ["CONVENTION", "ARRETE_EXTENSION", "AUTRE"],
  CONTRACTION: ["CONVENTION", "ARRETE_CONTRACTION", "AUTRE"],
  FERMETURE: ["AUTRE"],
};

const buildTransfoActes = (
  svtType: StructureVersionTransformationType,
  effectiveDate: Date
): ActePlan[] =>
  TRANSFO_ACTE_CATEGORIES[svtType].map((category) =>
    acteWithCategory(
      category,
      addMonths(effectiveDate, -1),
      addMonths(effectiveDate, 60)
    )
  );

const planStructureRelations = (params: {
  type: StructureType;
  isFinalised: boolean;
  creationDate: Date;
  finalisationFormDefId: number;
  finalisationStepDefinitions: { id: number; slug: string }[];
  typologieSpecs: TypologieSpec[];
}): StructureRelationsPlan => {
  const { formSteps, ...finalisationForm } = createFakeFormWithSteps(
    params.finalisationFormDefId,
    params.finalisationStepDefinitions,
    { isFinalised: params.isFinalised }
  );

  const relations: StructureRelationsPlan = {
    actes: buildStructureLevelActes(params.creationDate),
    documentsFinanciers: Array.from({ length: 5 }, () =>
      splitFileUploads(createFakeDocumentFinancier())
    ),
    forms: [
      {
        form: { ...finalisationForm, status: params.isFinalised },
        formSteps,
      },
    ],
    typologies: params.typologieSpecs.map((spec) =>
      createFakeStructureTypologie(spec)
    ),
    budgets: [],
    indicateursFinanciers: [],
    controles: [],
    evaluations: [],
  };

  if (!params.isFinalised) {
    return relations;
  }

  relations.budgets = [2026, 2025, 2024, 2023, 2022, 2021].map((year) =>
    createFakeBudget({ year, type: params.type })
  );
  relations.indicateursFinanciers = [
    createFakeIndicateurFinancier({ year: 2026, type: "PREVISIONNEL" }),
    createFakeIndicateurFinancier({ year: 2025, type: "PREVISIONNEL" }),
    createFakeIndicateurFinancier({ year: 2024, type: "REALISE" }),
    createFakeIndicateurFinancier({ year: 2023, type: "REALISE" }),
    createFakeIndicateurFinancier({ year: 2022, type: "REALISE" }),
    createFakeIndicateurFinancier({ year: 2021, type: "REALISE" }),
  ];
  relations.controles = Array.from({ length: 3 }, () =>
    splitFileUploads(createFakeControle())
  );
  relations.evaluations = isStructureAutorisee(params.type)
    ? Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
        splitFileUploads(createFakeEvaluation())
      )
    : [];

  return relations;
};

const TRANSFO_TYPE_BY_KIND: Record<
  "CREATION" | TransfoKind,
  TransformationType
> = {
  CREATION: TransformationType.OUVERTURE_EX_NIHILO,
  EXTENSION: TransformationType.EXTENSION_EX_NIHILO,
  CONTRACTION: TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES,
  FERMETURE: TransformationType.FERMETURE_SANS_TRANSFERT,
};

const BLOCK_FORM_SLUG: Record<StructureVersionTransformationType, string> = {
  CREATION: "structure-transformation-creation-v1",
  EXTENSION: "structure-transformation-extension-v1",
  CONTRACTION: "structure-transformation-contraction-v1",
  FERMETURE: "structure-transformation-fermeture-v1",
};

const planTransformedVersion = (params: {
  operateurId: number;
  structureType: StructureType;
  svtType: StructureVersionTransformationType;
  effectiveDate: Date;
  places: number;
  scalars: VersionScalars;
  contacts: StableContacts;
  formDefs: FormDefLookup;
}): VersionPlan => {
  const topForm = params.formDefs.get("transformation-v1");
  const blockForm = params.formDefs.get(BLOCK_FORM_SLUG[params.svtType]);
  if (!topForm || !blockForm) {
    throw new Error(
      `FormDefinition manquante pour la transformation ${params.svtType}`
    );
  }

  return {
    version: {
      effectiveDate: params.effectiveDate,
      placesAutorisees:
        params.svtType === "FERMETURE" ? null : params.places,
      ...params.scalars,
    },
    contacts: params.contacts,
    adresses: createFakeAdresses({ placesAutorisees: params.places }),
    transformation: {
      type: TRANSFO_TYPE_BY_KIND[params.svtType],
      form: {
        form: { formDefinitionId: topForm.id, status: true },
        formSteps: [],
      },
      structureVersionTransformation: {
        type: params.svtType,
        operateurId: params.operateurId,
        structureType: params.structureType,
        motif: params.svtType === "FERMETURE" ? faker.lorem.sentence() : null,
      },
      actes: buildTransfoActes(params.svtType, params.effectiveDate),
      structureVersionTransformationForm: {
        form: { formDefinitionId: blockForm.id, status: true },
        formSteps: blockForm.stepDefinitionIds.map((stepDefinitionId) => ({
          stepDefinitionId,
          status: StepStatus.VALIDE,
        })),
      },
    },
  };
};

// La version socle n'a pas de date effective : c'est la dernière version datée
// passée qui fait foi, sinon le socle lui-même.
const resolveCurrentVersionIndex = (
  timeline: VersionSpec[],
  now: Date
): number => {
  let currentIndex = -1;
  timeline.forEach((version, index) => {
    if (version.provenance === "INITIALE") {
      return;
    }
    if (version.effectiveDate > now) {
      return;
    }
    if (
      currentIndex === -1 ||
      version.effectiveDate >= timeline[currentIndex].effectiveDate
    ) {
      currentIndex = index;
    }
  });
  return currentIndex === -1 ? 0 : currentIndex;
};

export const planStructure = (params: SeedStructureParams): StructurePlan => {
  const history = planStructureHistory(params.ofii, params.now);
  const scalars = buildVersionScalars(
    params.departementAdministratif,
    params.ofii,
    params.coordinates
  );
  const contacts: StableContacts = params.ofii
    ? []
    : Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
        createFakeContact()
      );

  const typologieSpecs: TypologieSpec[] = params.ofii
    ? []
    : buildTypologieSpecs(history.versions, history.creationDate, params.now);

  const relations = params.ofii
    ? null
    : planStructureRelations({
        typologieSpecs,
        type: params.type,
        isFinalised: params.isFinalised,
        creationDate: history.creationDate,
        finalisationFormDefId: params.finalisationFormDefId,
        finalisationStepDefinitions: params.finalisationStepDefinitions,
      });

  const fermeture = history.versions.find(
    (version) =>
      version.provenance === "TRANSFO" && version.transfoType === "FERMETURE"
  );

  const versions = history.versions.map((version): VersionPlan => {
    if (version.provenance === "INITIALE") {
      return {
        version: {
          effectiveDate: null,
          placesAutorisees: version.places,
          ...scalars,
        },
        contacts,
        adresses: params.ofii
          ? []
          : createFakeAdresses({ placesAutorisees: version.places }),
        transformation: null,
      };
    }

    return planTransformedVersion({
      operateurId: params.operateurId,
      structureType: params.type,
      svtType:
        version.provenance === "CREATION" ? "CREATION" : version.transfoType,
      effectiveDate: version.effectiveDate,
      places: version.places,
      scalars,
      contacts,
      formDefs: params.formDefs,
    });
  });

  return {
    structure: {
      codeBhasile: params.codeBhasile,
      operateurId: params.operateurId,
      filiale: params.filiale,
      creationDate: history.creationDate,
      fermetureDate: fermeture?.effectiveDate ?? null,
      departementAdministratif: params.departementAdministratif,
      type: params.type,
    },
    relations,
    versions,
    currentVersionIndex: resolveCurrentVersionIndex(
      history.versions,
      params.now
    ),
  };
};
