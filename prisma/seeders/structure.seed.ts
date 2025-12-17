import { fakerFR as faker } from "@faker-js/faker";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  Activite,
  Budget,
  Contact,
  EvenementIndesirableGrave,
  FileUpload,
  Form,
  FormStep,
  Prisma,
  PublicType,
  Structure,
  StructureTypologie,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { createFakeActivites } from "./activite.seed";
import { AdresseWithTypologies, createFakeAdresses } from "./adresse.seed";
import { createFakeBudget } from "./budget.seed";
import { createFakeContact } from "./contact.seed";
import { ControleWithFileUploads, createFakeControle } from "./controle.seed";
import { createFakeEvenementIndesirableGrave } from "./evenement-indesirable-grave.seed";
import { createFakeFileUpload } from "./file-upload.seed";
import { createFakeFormWithSteps } from "./form.seed";
import { generateDatePair } from "./seed-util";
import { createFakeStructureTypologie } from "./structure-typologie.seed";

// TODO: re-add a way to name with the fact the structure is, or has been part of a CPOM
const generateDnaCode = ({
  type,
  operateurName,
  departementAdministratif,
  counter,
}: Partial<FakeStructureOptions> & { counter: number }): string => {
  const operateurNum = operateurName?.replace(/\D/g, "") ?? "";
  return `${type}-${operateurNum}-${departementAdministratif}-${counter}`;
};

export const createFakeStructure = ({
  cpom,
  type,
  ofii,
  operateurName,
  departementAdministratif,
  counter,
}: FakeStructureOptions): Partial<Structure> => {
  const [debutConvention, finConvention] = generateDatePair();
  const [debutPeriodeAutorisation, finPeriodeAutorisation] = generateDatePair();
  const [debutCpom, finCpom] = generateDatePair();

  const isAutorisee = isStructureAutorisee(type);
  const createdAt = faker.date.past();
  const creationDate = faker.date.past();
  const baseData = {
    dnaCode: generateDnaCode({
      type,
      operateurName,
      departementAdministratif,
      counter,
    }),
    type,
    nom: faker.lorem.words(2),
    nomOfii: faker.lorem.words(2),
    departementAdministratif,
    directionTerritoriale: "DT " + faker.location.city(),
    createdAt,
    updatedAt: createdAt,
    activeInOfiiFileSince: createdAt,
    inactiveInOfiiFileSince:
      faker.helpers.maybe(
        () =>
          faker.date.between({
            from: createdAt,
            to: new Date(),
          }),
        { probability: 0.1 }
      ) ?? null,
  };

  if (ofii) {
    return baseData;
  }

  return {
    ...baseData,
    dnaCode: generateDnaCode({
      type,
      operateurName,
      departementAdministratif,
      counter,
    }),
    // TODO : à gérer quand les filiales d'opérateurs seront en DB
    filiale: "",
    adresseAdministrative: faker.location.streetAddress(),
    communeAdministrative: faker.location.city(),
    codePostalAdministratif: faker.location.zipCode(),
    latitude: Prisma.Decimal(
      faker.location.latitude({ min: 43.550851, max: 49.131627 })
    ),
    longitude: Prisma.Decimal(
      faker.location.longitude({ min: -0.851371, max: 5.843377 })
    ),
    date303: null,
    debutConvention,
    finConvention,
    cpom,
    creationDate,
    finessCode: isAutorisee ? faker.number.int(1000000000).toString() : null,
    lgbt: faker.datatype.boolean(),
    fvvTeh: faker.datatype.boolean(),
    public: faker.helpers.enumValue(PublicType),
    debutPeriodeAutorisation: isAutorisee ? debutPeriodeAutorisation : null,
    finPeriodeAutorisation: isAutorisee ? finPeriodeAutorisation : null,
    debutCpom: cpom ? debutCpom : null,
    finCpom: cpom ? finCpom : null,
    placesACreer: faker.number.int(100),
    placesAFermer: faker.number.int(100),
    echeancePlacesACreer: faker.date.future(),
    echeancePlacesAFermer: faker.date.future(),
    notes: faker.lorem.lines(2),
    activeInOfiiFileSince:
      faker.helpers.maybe(
        () => faker.date.between({ from: creationDate, to: new Date() }),
        { probability: 0.01 }
      ) ?? null,
  };
};

type StructureWithRelations = Structure & {
  contacts: Omit<Contact, "id" | "structureDnaCode">[];
  adresses: Omit<AdresseWithTypologies, "id" | "structureDnaCode">[];
  controles: Omit<ControleWithFileUploads, "id" | "structureDnaCode">[];
  structureTypologies: Omit<StructureTypologie, "id" | "structureDnaCode">[];
  budgets: Omit<Budget, "id" | "structureDnaCode">[];
  activites: Omit<Activite, "id" | "structureDnaCode">[];
  fileUploads: Omit<
    FileUpload,
    "id" | "structureDnaCode" | "controleId" | "parentFileUploadId"
  >[];
  evenementsIndesirablesGraves: Omit<
    EvenementIndesirableGrave,
    "id" | "structureDnaCode"
  >[];
  forms: (Omit<Form, "id" | "structureDnaCode"> & {
    formSteps: Omit<FormStep, "id" | "formId">[];
  })[];
};

export const createFakeStuctureWithRelations = ({
  cpom,
  type,
  isFinalised,
  formDefinitionId,
  stepDefinitions,
  ofii,
  operateurName,
  departementAdministratif,
  counter,
}: FakeStructureWithRelationsOptions): Omit<StructureWithRelations, "id"> => {
  const fakeStructure = createFakeStructure({
    cpom,
    type,
    isFinalised,
    ofii,
    operateurName,
    departementAdministratif,
    counter,
  });
  const placesAutorisees = faker.number.int({ min: 1, max: 100 });

  const forms = [
    createFakeFormWithSteps(formDefinitionId, stepDefinitions, {
      isFinalised,
    }),
  ];
  const [finalisationForm] = forms;
  finalisationForm.status = isFinalised;

  let structureWithRelations = {
    ...fakeStructure,
    contacts: [createFakeContact("PRINCIPAL"), createFakeContact("SECONDAIRE")],
    adresses: createFakeAdresses({ placesAutorisees }),
    structureTypologies: [
      createFakeStructureTypologie({ year: 2025, placesAutorisees }),
      createFakeStructureTypologie({ year: 2024, placesAutorisees }),
      createFakeStructureTypologie({ year: 2023, placesAutorisees }),
    ],
    fileUploads: Array.from({ length: 5 }, () =>
      createFakeFileUpload({
        cpom,
        structureType: type,
      })
    ),
    activites: createFakeActivites(),
    evenementsIndesirablesGraves: Array.from({ length: 5 }, () =>
      createFakeEvenementIndesirableGrave()
    ),
    forms,
  } as StructureWithRelations;

  if (isFinalised) {
    structureWithRelations = {
      ...structureWithRelations,
      budgets: [
        createFakeBudget({ year: 2025, type, cpom }),
        createFakeBudget({ year: 2024, type, cpom }),
        createFakeBudget({ year: 2023, type, cpom }),
        createFakeBudget({ year: 2022, type, cpom }),
        createFakeBudget({ year: 2021, type, cpom }),
      ],
      controles: [
        createFakeControle(),
        createFakeControle(),
        createFakeControle(),
      ],
    };
  }

  return structureWithRelations;
};

export type FakeStructureOptions = {
  cpom: boolean;
  type: StructureType;
  isFinalised: boolean;
  ofii: boolean;
  operateurName: string;
  departementAdministratif: string;
  counter: number;
};

export type FakeStructureWithRelationsOptions = FakeStructureOptions & {
  formDefinitionId: number;
  stepDefinitions: { id: number; slug: string }[];
};
