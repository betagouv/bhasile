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

import { IdAllocator } from "../utils/bulk";
import { SeedRows, SeedTable } from "../utils/seed-rows";
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

export type SeedContext = {
  rows: SeedRows;
  nextId: IdAllocator<SeedTable>;
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
  | { provenance: "INITIALE" | "CREATION"; effectiveDate: Date; places: number }
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
    {
      provenance: startsByCreationTranformation ? "CREATION" : "INITIALE",
      effectiveDate: creationDate,
      places,
    },
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

type FileUploadSeed = ReturnType<typeof createFakeFileUpload>;

const pushFileUploads = (
  context: SeedContext,
  fileUploads: FileUploadSeed[],
  link: Pick<
    Prisma.FileUploadCreateManyInput,
    "acteAdministratifId" | "documentFinancierId" | "controleId" | "evaluationId"
  >
): void => {
  for (const fileUpload of fileUploads) {
    context.rows.FileUpload.push({
      id: context.nextId("FileUpload"),
      ...fileUpload,
      ...link,
    });
  }
};

const pushActes = (
  context: SeedContext,
  actes: (Omit<Prisma.ActeAdministratifCreateManyInput, "id"> & {
    fileUploads: FileUploadSeed[];
  })[],
  link: Pick<
    Prisma.ActeAdministratifCreateManyInput,
    "structureId" | "structureVersionTransformationId"
  >
): void => {
  for (const { fileUploads, ...acte } of actes) {
    const acteAdministratifId = context.nextId("ActeAdministratif");
    context.rows.ActeAdministratif.push({
      id: acteAdministratifId,
      ...acte,
      ...link,
    });
    pushFileUploads(context, fileUploads, { acteAdministratifId });
  }
};

const pushForm = (
  context: SeedContext,
  form: Omit<Prisma.FormCreateManyInput, "id"> & {
    formSteps: Omit<Prisma.FormStepCreateManyInput, "id" | "formId">[];
  },
  link: Pick<
    Prisma.FormCreateManyInput,
    "structureId" | "transformationId" | "structureVersionTransformationId"
  >
): void => {
  const { formSteps, ...formRow } = form;
  const formId = context.nextId("Form");
  context.rows.Form.push({ id: formId, ...formRow, ...link });

  for (const formStep of formSteps) {
    context.rows.FormStep.push({
      id: context.nextId("FormStep"),
      formId,
      ...formStep,
    });
  }
};

const pushVersion = (
  context: SeedContext,
  version: Omit<Prisma.StructureVersionCreateManyInput, "id">,
  contacts: StableContacts,
  adresses: ReturnType<typeof createFakeAdresses>
): number => {
  const structureVersionId = context.nextId("StructureVersion");
  context.rows.StructureVersion.push({ id: structureVersionId, ...version });

  for (const contact of contacts) {
    context.rows.Contact.push({
      ...contact,
      id: context.nextId("Contact"),
      structureVersionId,
    });
  }
  for (const adresse of adresses) {
    context.rows.Adresse.push({
      ...adresse,
      id: context.nextId("Adresse"),
      structureVersionId,
    });
  }

  return structureVersionId;
};

const acteWithCategory = (
  category: ActeAdministratifCategory,
  startDate: Date,
  endDate: Date
) => {
  const acte = createFakeActeAdministratif();
  return { ...acte, category, startDate, endDate };
};

const buildStructureLevelActes = (creationDate: Date) => [
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
) =>
  TRANSFO_ACTE_CATEGORIES[svtType].map((category) =>
    acteWithCategory(
      category,
      addMonths(effectiveDate, -1),
      addMonths(effectiveDate, 60)
    )
  );

const pushStructureRelations = (
  context: SeedContext,
  params: {
    structureId: number;
    type: StructureType;
    isFinalised: boolean;
    creationDate: Date;
    finalisationFormDefId: number;
    finalisationStepDefinitions: { id: number; slug: string }[];
    typologieSpecs: TypologieSpec[];
  }
): void => {
  const { structureId } = params;

  const finalisationForm = createFakeFormWithSteps(
    params.finalisationFormDefId,
    params.finalisationStepDefinitions,
    { isFinalised: params.isFinalised }
  );
  finalisationForm.status = params.isFinalised;

  pushActes(context, buildStructureLevelActes(params.creationDate), {
    structureId,
  });

  for (const documentFinancier of Array.from({ length: 5 }, () =>
    createFakeDocumentFinancier()
  )) {
    const { fileUploads, ...documentFinancierRow } = documentFinancier;
    const documentFinancierId = context.nextId("DocumentFinancier");
    context.rows.DocumentFinancier.push({
      id: documentFinancierId,
      structureId,
      ...documentFinancierRow,
    });
    pushFileUploads(context, fileUploads, { documentFinancierId });
  }

  pushForm(context, finalisationForm, { structureId });

  for (const spec of params.typologieSpecs) {
    context.rows.StructureTypologie.push({
      id: context.nextId("StructureTypologie"),
      structureId,
      ...createFakeStructureTypologie(spec),
    });
  }

  if (!params.isFinalised) {
    return;
  }

  for (const year of [2026, 2025, 2024, 2023, 2022, 2021]) {
    context.rows.Budget.push({
      id: context.nextId("Budget"),
      structureId,
      ...createFakeBudget({ year, type: params.type }),
    });
  }

  for (const indicateur of [
    { year: 2026, type: "PREVISIONNEL" },
    { year: 2025, type: "PREVISIONNEL" },
    { year: 2024, type: "REALISE" },
    { year: 2023, type: "REALISE" },
    { year: 2022, type: "REALISE" },
    { year: 2021, type: "REALISE" },
  ] as const) {
    context.rows.IndicateurFinancier.push({
      id: context.nextId("IndicateurFinancier"),
      structureId,
      ...createFakeIndicateurFinancier(indicateur),
    });
  }

  for (const controle of Array.from({ length: 3 }, () =>
    createFakeControle()
  )) {
    const { fileUploads, ...controleRow } = controle;
    const controleId = context.nextId("Controle");
    context.rows.Controle.push({ id: controleId, structureId, ...controleRow });
    pushFileUploads(context, fileUploads, { controleId });
  }

  const evaluations = isStructureAutorisee(params.type)
    ? Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
        createFakeEvaluation()
      )
    : [];
  for (const evaluation of evaluations) {
    const { fileUploads, ...evaluationRow } = evaluation;
    const evaluationId = context.nextId("Evaluation");
    context.rows.Evaluation.push({
      id: evaluationId,
      structureId,
      ...evaluationRow,
    });
    pushFileUploads(context, fileUploads, { evaluationId });
  }
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

const pushTransformation = (
  context: SeedContext,
  params: {
    structureId: number;
    operateurId: number;
    structureType: StructureType;
    svtType: StructureVersionTransformationType;
    effectiveDate: Date;
    places: number;
    scalars: VersionScalars;
    contacts: StableContacts;
    formDefs: FormDefLookup;
  }
): { id: number; effectiveDate: Date } => {
  const topForm = params.formDefs.get("transformation-v1");
  const blockForm = params.formDefs.get(BLOCK_FORM_SLUG[params.svtType]);
  if (!topForm || !blockForm) {
    throw new Error(
      `FormDefinition manquante pour la transformation ${params.svtType}`
    );
  }

  const transformationId = context.nextId("Transformation");
  context.rows.Transformation.push({
    id: transformationId,
    type: TRANSFO_TYPE_BY_KIND[params.svtType],
  });
  pushForm(
    context,
    { formDefinitionId: topForm.id, status: true, formSteps: [] },
    { transformationId }
  );

  const structureVersionTransformationId = context.nextId(
    "StructureVersionTransformation"
  );
  context.rows.StructureVersionTransformation.push({
    id: structureVersionTransformationId,
    transformationId,
    type: params.svtType,
    operateurId: params.operateurId,
    structureType: params.structureType,
    motif: params.svtType === "FERMETURE" ? faker.lorem.sentence() : null,
  });

  pushActes(context, buildTransfoActes(params.svtType, params.effectiveDate), {
    structureVersionTransformationId,
  });

  pushForm(
    context,
    {
      formDefinitionId: blockForm.id,
      status: true,
      formSteps: blockForm.stepDefinitionIds.map((stepDefinitionId) => ({
        stepDefinitionId,
        status: StepStatus.VALIDE,
      })),
    },
    { structureVersionTransformationId }
  );

  const id = pushVersion(
    context,
    {
      structureId: params.structureId,
      structureVersionTransformationId,
      effectiveDate: params.effectiveDate,
      placesAutorisees:
        params.svtType === "FERMETURE" ? null : params.places,
      ...params.scalars,
    },
    params.contacts,
    createFakeAdresses({ placesAutorisees: params.places })
  );

  return { id, effectiveDate: params.effectiveDate };
};

const resolveCurrentVersionId = (
  versions: { id: number; effectiveDate: Date | null }[],
  now: Date
): number => {
  const upperBound = now.getTime();
  const dated = versions.filter(
    (version): version is { id: number; effectiveDate: Date } =>
      version.effectiveDate !== null &&
      version.effectiveDate.getTime() <= upperBound
  );
  if (dated.length > 0) {
    return dated.reduce((latest, version) =>
      version.effectiveDate.getTime() >= latest.effectiveDate.getTime()
        ? version
        : latest
    ).id;
  }
  // Si aucune version datée effective le socle (effectiveDate null) fait foi.
  const socle = versions.find((version) => version.effectiveDate === null);
  return (socle ?? versions[0]).id;
};

export const buildStructureRows = (
  context: SeedContext,
  params: SeedStructureParams
): SeededStructure => {
  const plan = planStructureHistory(params.ofii, params.now);
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
    : buildTypologieSpecs(plan.versions, plan.creationDate, params.now);

  const fermeture = plan.versions.find(
    (version) =>
      version.provenance === "TRANSFO" && version.transfoType === "FERMETURE"
  );

  const structureId = context.nextId("Structure");
  context.rows.Structure.push({
    id: structureId,
    codeBhasile: params.codeBhasile,
    operateurId: params.operateurId,
    filiale: params.filiale,
    creationDate: plan.creationDate,
    fermetureDate: fermeture?.effectiveDate ?? null,
    departementAdministratif: params.departementAdministratif,
    type: params.type,
  });

  if (!params.ofii) {
    pushStructureRelations(context, {
      structureId,
      typologieSpecs,
      type: params.type,
      isFinalised: params.isFinalised,
      creationDate: plan.creationDate,
      finalisationFormDefId: params.finalisationFormDefId,
      finalisationStepDefinitions: params.finalisationStepDefinitions,
    });
  }

  const [initial, ...transfos] = plan.versions;
  const versionRefs: { id: number; effectiveDate: Date | null }[] = [];

  if (initial.provenance === "INITIALE") {
    versionRefs.push({
      id: pushVersion(
        context,
        {
          structureId,
          effectiveDate: null,
          placesAutorisees: initial.places,
          ...scalars,
        },
        contacts,
        params.ofii
          ? []
          : createFakeAdresses({ placesAutorisees: initial.places })
      ),
      effectiveDate: null,
    });
  } else {
    versionRefs.push(
      pushTransformation(context, {
        structureId,
        operateurId: params.operateurId,
        structureType: params.type,
        svtType: "CREATION",
        effectiveDate: initial.effectiveDate,
        places: initial.places,
        scalars,
        contacts,
        formDefs: params.formDefs,
      })
    );
  }

  for (const transfo of transfos) {
    if (transfo.provenance !== "TRANSFO") {
      continue;
    }
    versionRefs.push(
      pushTransformation(context, {
        structureId,
        operateurId: params.operateurId,
        structureType: params.type,
        svtType: transfo.transfoType,
        effectiveDate: transfo.effectiveDate,
        places: transfo.places,
        scalars,
        contacts,
        formDefs: params.formDefs,
      })
    );
  }

  return {
    structureId,
    currentVersionId: resolveCurrentVersionId(versionRefs, params.now),
  };
};
