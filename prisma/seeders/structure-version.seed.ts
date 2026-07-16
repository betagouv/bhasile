import { fakerFR as faker } from "@faker-js/faker";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  ActeAdministratifCategory,
  Prisma,
  PrismaClient,
  PublicType,
  StepStatus,
  StructureVersionTransformationType,
  TransformationType,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { convertToPrismaObject } from "../utils/common.util";
import { createFakeActeAdministratif } from "./acte-administratif.seed";
import { createFakeAdresses } from "./adresse.seed";
import { createFakeBudget } from "./budget.seed";
import { createFakeContact } from "./contact.seed";
import { createFakeControle } from "./controle.seed";
import { createFakeDocumentFinancier } from "./document-financier";
import { createFakeEvaluation } from "./evaluation.seed";
import { createFakeFormWithSteps } from "./form.seed";
import { createFakeIndicateurFinancier } from "./indicateur-financier";
import { createFakeStructureTypologie } from "./structure-typologie.seed";

export type FormDefInfo = { id: number; stepDefinitionIds: number[] };
export type FormDefLookup = Map<string, FormDefInfo>;

export type SeedStructureParams = {
  operateurId: number;
  codeBhasile: string;
  departementAdministratif: string;
  type: StructureType;
  ofii: boolean;
  isFinalised: boolean;
  now: Date;
  formDefs: FormDefLookup;
  finalisationFormDefId: number;
  finalisationStepDefinitions: { id: number; slug: string }[];
  initialisationCampaignDefinitionId: number;
};

export type SeededStructure = { structureId: number; currentVersionId: number };

type TransfoKind = "EXTENSION" | "CONTRACTION" | "FERMETURE";

type VersionSpec =
  | { provenance: "CAMPAIGN" | "CREATION"; effectiveDate: Date; places: number }
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
        { provenance: "CAMPAIGN", effectiveDate: creationDate, places: 0 },
      ],
    };
  }

  const startsByCreationTranformation = faker.datatype.boolean({
    probability: 0.1,
  });
  let places = faker.number.int({ min: 20, max: 150 });
  const versions: VersionSpec[] = [
    {
      provenance: startsByCreationTranformation ? "CREATION" : "CAMPAIGN",
      effectiveDate: creationDate,
      places,
    },
  ];

  const nbTransfos = pickNbTransfos();
  const endsWithFermeture =
    nbTransfos > 0 && faker.datatype.boolean({ probability: 0.2 });
  const endsInFuture =
    nbTransfos > 0 && faker.datatype.boolean({ probability: 0.27 });

  let cursor = creationDate;
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
  ofii: boolean
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
      faker.location.latitude({ min: 43.550851, max: 49.131627 })
    ),
    longitude: new Prisma.Decimal(
      faker.location.longitude({ min: -0.851371, max: 5.843377 })
    ),
    public: faker.helpers.enumValue(PublicType),
    notes: faker.lorem.lines(2),
  };
};

const stripVersionId = <T extends { structureVersionId?: unknown }>(
  entity: T
): Omit<T, "structureVersionId"> => {
  const clone: Record<string, unknown> = { ...entity };
  delete clone.structureVersionId;
  return clone as Omit<T, "structureVersionId">;
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

const buildVersionCommon = (
  scalars: VersionScalars,
  effectiveDate: Date,
  places: number,
  typologieSpecs: TypologieSpec[],
  contacts: StableContacts,
  ofii: boolean
) => {
  const base = { effectiveDate, ...scalars };

  if (ofii) {
    return base;
  }

  const typologies = typologieSpecs.map((spec) =>
    createFakeStructureTypologie({
      year: spec.year,
      placesAutorisees: spec.placesAutorisees,
    })
  );
  const adresses = createFakeAdresses({ placesAutorisees: places });

  return {
    ...base,
    contacts: { create: contacts.map(stripVersionId) },
    structureTypologies: { create: typologies.map(stripVersionId) },
    adresses: {
      create: adresses.map(({ adresseTypologies, ...adresse }) => ({
        ...stripVersionId(adresse),
        adresseTypologies: { create: adresseTypologies },
      })),
    },
  };
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

const buildTransfoActesCreate = (
  svtType: StructureVersionTransformationType,
  effectiveDate: Date
) =>
  TRANSFO_ACTE_CATEGORIES[svtType]
    .map((category) =>
      acteWithCategory(
        category,
        addMonths(effectiveDate, -1),
        addMonths(effectiveDate, 60)
      )
    )
    .map(({ fileUploads, ...acte }) => ({
      ...acte,
      fileUploads: { create: fileUploads },
    }));

const buildNonVersionedRelations = (params: {
  type: StructureType;
  isFinalised: boolean;
  creationDate: Date;
  finalisationFormDefId: number;
  finalisationStepDefinitions: { id: number; slug: string }[];
}): Record<string, unknown> => {
  const finalisationForm = createFakeFormWithSteps(
    params.finalisationFormDefId,
    params.finalisationStepDefinitions,
    { isFinalised: params.isFinalised }
  );
  finalisationForm.status = params.isFinalised;

  const relations: Record<string, unknown> = {
    actesAdministratifs: buildStructureLevelActes(params.creationDate),
    documentsFinanciers: Array.from({ length: 5 }, () =>
      createFakeDocumentFinancier()
    ),
    forms: [finalisationForm],
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
    createFakeIndicateurFinancier({ year: 2024, type: "PREVISIONNEL" }),
    createFakeIndicateurFinancier({ year: 2023, type: "REALISE" }),
    createFakeIndicateurFinancier({ year: 2022, type: "REALISE" }),
    createFakeIndicateurFinancier({ year: 2021, type: "REALISE" }),
  ];
  relations.controles = [
    createFakeControle(),
    createFakeControle(),
    createFakeControle(),
  ];
  relations.evaluations = isStructureAutorisee(params.type)
    ? Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
        createFakeEvaluation()
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

const persistTransformation = async (
  prisma: PrismaClient,
  params: {
    structureId: number;
    operateurId: number;
    structureType: StructureType;
    svtType: StructureVersionTransformationType;
    effectiveDate: Date;
    places: number;
    scalars: VersionScalars;
    typologieSpecs: TypologieSpec[];
    contacts: StableContacts;
    formDefs: FormDefLookup;
  }
): Promise<{ id: number; effectiveDate: Date }> => {
  const topForm = params.formDefs.get("transformation-v1");
  const blockForm = params.formDefs.get(BLOCK_FORM_SLUG[params.svtType]);
  if (!topForm || !blockForm) {
    throw new Error(
      `FormDefinition manquante pour la transformation ${params.svtType}`
    );
  }

  const versionCommon = buildVersionCommon(
    params.scalars,
    params.effectiveDate,
    params.places,
    params.typologieSpecs,
    params.contacts,
    false
  );

  const structureVersion: Prisma.StructureVersionUncheckedCreateWithoutStructureVersionTransformationInput =
    { structureId: params.structureId, ...versionCommon };

  const data: Prisma.TransformationUncheckedCreateInput = {
    type: TRANSFO_TYPE_BY_KIND[params.svtType],
    form: { create: { formDefinitionId: topForm.id, status: true } },
    structureVersionTransformations: {
      create: [
        {
          type: params.svtType,
          operateurId: params.operateurId,
          structureType: params.structureType,
          motif: params.svtType === "FERMETURE" ? faker.lorem.sentence() : null,
          actesAdministratifs: {
            create: buildTransfoActesCreate(
              params.svtType,
              params.effectiveDate
            ),
          },
          form: {
            create: {
              formDefinitionId: blockForm.id,
              status: true,
              formSteps: {
                create: blockForm.stepDefinitionIds.map((stepDefinitionId) => ({
                  stepDefinitionId,
                  status: StepStatus.VALIDE,
                })),
              },
            },
          },
          structureVersion: { create: structureVersion },
        },
      ],
    },
  };

  const transformation = await prisma.transformation.create({
    data,
    select: {
      structureVersionTransformations: {
        select: {
          structureVersion: { select: { id: true, effectiveDate: true } },
        },
      },
    },
  });

  const version =
    transformation.structureVersionTransformations[0]?.structureVersion;
  if (!version) {
    throw new Error("StructureVersion non créée par la transformation");
  }

  if (params.svtType === "FERMETURE") {
    await prisma.structure.update({
      where: { id: params.structureId },
      data: { fermetureDate: params.effectiveDate },
    });
  }

  return { ...version, effectiveDate: version.effectiveDate! };
};

const resolveCurrentVersionId = (
  versions: { id: number; effectiveDate: Date }[],
  now: Date
): number => {
  const upperBound = now.getTime();
  const candidates = versions.filter(
    (version) => version.effectiveDate.getTime() <= upperBound
  );
  const pool = candidates.length > 0 ? candidates : versions;
  return pool.reduce((latest, version) =>
    version.effectiveDate.getTime() >= latest.effectiveDate.getTime()
      ? version
      : latest
  ).id;
};

export const seedStructureWithVersions = async (
  prisma: PrismaClient,
  params: SeedStructureParams
): Promise<SeededStructure> => {
  const plan = planStructureHistory(params.ofii, params.now);
  const scalars = buildVersionScalars(
    params.departementAdministratif,
    params.ofii
  );
  const contacts: StableContacts = params.ofii
    ? []
    : Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
        createFakeContact()
      );

  const typologieSpecsUpTo = (versionIndex: number): TypologieSpec[] =>
    params.ofii
      ? []
      : buildTypologieSpecs(
          plan.versions.slice(0, versionIndex + 1),
          plan.creationDate,
          params.now
        );

  const nonVersioned = params.ofii
    ? {}
    : buildNonVersionedRelations({
        type: params.type,
        isFinalised: params.isFinalised,
        creationDate: plan.creationDate,
        finalisationFormDefId: params.finalisationFormDefId,
        finalisationStepDefinitions: params.finalisationStepDefinitions,
      });

  const [initial, ...transfos] = plan.versions;
  const versionRefs: { id: number; effectiveDate: Date }[] = [];

  let structureId: number;

  if (initial.provenance === "CAMPAIGN") {
    const campaign = await prisma.campaign.create({
      data: { campaignDefinitionId: params.initialisationCampaignDefinitionId },
    });
    const versionCommon = buildVersionCommon(
      scalars,
      initial.effectiveDate,
      initial.places,
      typologieSpecsUpTo(0),
      contacts,
      params.ofii
    );
    const structureData: Prisma.StructureUncheckedCreateInput = {
      codeBhasile: params.codeBhasile,
      operateurId: params.operateurId,
      creationDate: plan.creationDate,
      departementAdministratif: params.departementAdministratif,
      type: params.type,
      ...convertToPrismaObject(nonVersioned),
      structureVersions: {
        create: [{ campaignId: campaign.id, ...versionCommon }],
      },
    };
    const structure = await prisma.structure.create({
      data: structureData,
      select: {
        id: true,
        structureVersions: { select: { id: true, effectiveDate: true } },
      },
    });
    structureId = structure.id;
    versionRefs.push(
      ...structure.structureVersions.map((structureVersion) => ({
        id: structureVersion.id,
        effectiveDate: structureVersion.effectiveDate!,
      }))
    );
  } else {
    const structureData: Prisma.StructureUncheckedCreateInput = {
      codeBhasile: params.codeBhasile,
      operateurId: params.operateurId,
      creationDate: plan.creationDate,
      departementAdministratif: params.departementAdministratif,
      type: params.type,
      ...convertToPrismaObject(nonVersioned),
    };
    const structure = await prisma.structure.create({
      data: structureData,
      select: { id: true },
    });
    structureId = structure.id;
    const version = await persistTransformation(prisma, {
      structureId,
      operateurId: params.operateurId,
      structureType: params.type,
      svtType: "CREATION",
      effectiveDate: initial.effectiveDate,
      places: initial.places,
      scalars,
      typologieSpecs: typologieSpecsUpTo(0),
      contacts,
      formDefs: params.formDefs,
    });
    versionRefs.push(version);
  }

  for (let transfoIndex = 0; transfoIndex < transfos.length; transfoIndex++) {
    const transfo = transfos[transfoIndex];
    if (transfo.provenance !== "TRANSFO") {
      continue;
    }
    const version = await persistTransformation(prisma, {
      structureId,
      operateurId: params.operateurId,
      structureType: params.type,
      svtType: transfo.transfoType,
      effectiveDate: transfo.effectiveDate,
      places: transfo.places,
      scalars,
      typologieSpecs: typologieSpecsUpTo(transfoIndex + 1),
      contacts,
      formDefs: params.formDefs,
    });
    versionRefs.push(version);
  }

  return {
    structureId,
    currentVersionId: resolveCurrentVersionId(versionRefs, params.now),
  };
};
