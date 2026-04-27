import { structureAutoriseesDocuments } from "@/app/components/forms/finance/documents/documentsStructures";
import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { FinessApiType } from "@/schemas/api/finess.schema";
import { FormApiType } from "@/schemas/api/form.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { Repartition } from "@/types/adresse.type";
import { ControleType } from "@/types/controle.type";
import { StepStatus } from "@/types/form.type";
import { PublicType, StructureType } from "@/types/structure.type";

export const createStructure = ({
  id,
  adresseAdministrative,
  adresses,
  type,
  finessCode,
  publicType,
  structureTypologies,
  structureMillesimes = [],
  cpomStructures = [],
  dnaStructures,
  finesses,
  forms,
}: CreateStructuresArgs): StructureApiRead => {
  const structureType = type ?? StructureType.CADA;

  return {
    id,
    codeBhasile: `BHA-${id}`,
    operateur: { structureDnaCode: `C000${id}`, id: 1, name: "Adoma" },
    filiale: undefined,
    operateurLabel: "Adoma",
    type: structureType,
    adresseAdministrative:
      adresseAdministrative ?? "1, avenue de la République",
    codePostalAdministratif: "75011",
    communeAdministrative: "Paris",
    departementAdministratif: "75",
    latitude: "48.8670239",
    longitude: "2.3612011",
    nom: "Les Mimosas",
    debutConvention: new Date("01/02/2024").toISOString(),
    finConvention: new Date("01/02/2027").toISOString(),
    creationDate: new Date("01/02/2007").toISOString(),
    finessCode: finessCode ?? "123456789",
    lgbt: true,
    fvvTeh: false,
    public: publicType ?? ("TOUT_PUBLIC" as PublicType),
    debutPeriodeAutorisation: new Date("01/02/2022").toISOString(),
    finPeriodeAutorisation: new Date("01/02/2025").toISOString(),
    adresses: adresses ?? [],
    notes: "Note 1",
    structureTypologies:
      structureTypologies ??
      [0, 1, 2, 3].map((delta) => ({
        id: delta + 1,
        year: CURRENT_YEAR - delta,
        placesAutorisees: 10,
        pmr: 0,
        lgbt: 0,
        fvvTeh: 0,
        placesACreer: 0,
        placesAFermer: 0,
        echeancePlacesACreer: undefined,
        echeancePlacesAFermer: undefined,
      })),
    structureMillesimes: structureMillesimes ?? [],
    cpomStructures: cpomStructures ?? [],
    forms: forms ?? [
      {
        id: 1,
        status: false,
        formDefinition: {
          id: 1,
          slug: "finalisation",
          name: "finalisation",
          version: 1,
        },
        formSteps: createAllFinalisationSteps(),
      },
    ],
    dnaStructures: dnaStructures ?? [
      {
        id: 1,
        dna: {
          id: 1,
          code: "C0001",
          description: "",
        },
        startDate: undefined,
        endDate: undefined,
      },
    ],
    finesses: finesses ?? [
      {
        id: 1,
        code: "123456789",
        description: "",
      },
    ],
    contacts: [],
    documentsFinanciers: [],
    repartition: Repartition.DIFFUS,
    isAutorisee:
      structureType === StructureType.CADA ||
      structureType === StructureType.CPH,
    isSubventionnee:
      structureType === StructureType.HUDA ||
      structureType === StructureType.CAES,
    currentPlaces: {
      placesAutorisees: structureTypologies?.[0]?.placesAutorisees ?? 0,
      qpv: 0,
      logementsSociaux: 0,
    },
    isInCpom: false,
    isInCpomPerYear: {},
  };
};

export const createAllFinalisationSteps = () => [
  {
    id: 11,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 1,
      label: "01-identification",
      slug: "01-identification",
    },
  },
  {
    id: 12,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 2,
      label: "02-documents-financiers",
      slug: "02-documents-financiers",
    },
  },
  {
    id: 13,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 3,
      label: "03-finance",
      slug: "03-finance",
    },
  },
  {
    id: 14,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 4,
      label: "04-controles",
      slug: "04-controles",
    },
  },
  {
    id: 15,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 5,
      label: "05-documents",
      slug: "05-documents",
    },
  },
  {
    id: 16,
    status: StepStatus.NON_COMMENCE,
    stepDefinition: {
      id: 6,
      label: "06-notes",
      slug: "06-notes",
    },
  },
];

export const createFinalisationValidStructure = (id: number) =>
  createStructure({
    id,
    type: StructureType.CADA,
    forms: [
      {
        id: 1,
        status: false,
        formDefinition: {
          id: 1,
          slug: "finalisation",
          name: "finalisation",
          version: 1,
        },
        formSteps: createAllFinalisationSteps(),
      },
    ],
  });

export const createFinalisationDocumentsFinanciersValidStructure = (
  id: number
) => {
  const structure = createFinalisationValidStructure(id);
  const { years } = getYearRange();
  const requiredDocuments = years.flatMap((year, index) =>
    structureAutoriseesDocuments
      .filter((document) => document.required && index >= document.yearIndex)
      .map((document, docIndex) => ({
        id: year * 100 + docIndex + 1,
        year,
        category: document.value,
        fileUploads: [
          {
            id: year * 100 + docIndex + 1,
            key: `${document.value.toLowerCase()}-${year}`,
          },
        ],
      }))
  );

  return {
    ...structure,
    documentsFinanciers: requiredDocuments,
  };
};

export const createFinalisationFinanceValidStructure = (id: number) => {
  const structure = createFinalisationDocumentsFinanciersValidStructure(id);
  const { years } = getYearRange();
  const cpomPerYear = Object.fromEntries(years.map((year) => [year, true]));

  return {
    ...structure,
    isInCpom: true,
    isInCpomPerYear: cpomPerYear,
    budgets: years.map((year, idx) => ({
      id: idx + 1,
      year,
      commentaire: "",
    })),
    indicateursFinanciers: years.flatMap((year, idx) => {
      return [
        {
          id: idx * 2 + 1,
          year,
          type: "PREVISIONNEL" as const,
          ETP: 1,
          tauxEncadrement: 1,
          coutJournalier: 1,
        },
        {
          id: idx * 2 + 2,
          year,
          type: "REALISE" as const,
          ETP: 1,
          tauxEncadrement: 1,
          coutJournalier: 1,
        },
      ];
    }),
  };
};

export const createFinalisationControlesValidStructure = (id: number) => {
  const structure = createFinalisationValidStructure(id);
  return {
    ...structure,
    controles: [
      {
        id: 1,
        date: "2024-01-10T12:00:00.000Z",
        type: ControleType.PROGRAMME,
        fileUploads: [{ id: 1, key: "controle-1" }],
      },
    ],
    evaluations: [
      {
        id: 1,
        date: "2024-01-12T12:00:00.000Z",
        notePersonne: 1,
        notePro: 1,
        noteStructure: 1,
        note: 1,
        fileUploads: [{ id: 1, key: "evaluation-1" }],
      },
    ],
    noEvaluationStructure: false,
  };
};

export const createModificationAdressesValidStructure = (id: number) => {
  const structure = createStructure({ id, type: StructureType.CADA });
  return {
    ...structure,
    repartition: Repartition.COLLECTIF,
    adresses: [
      {
        id: 1,
        structureId: id,
        adresseComplete: "1 rue de Paris 75011 Paris",
        adresse: "1 rue de Paris",
        codePostal: "75011",
        commune: "Paris",
        departement: "75",
        repartition: Repartition.COLLECTIF,
        adresseTypologies: [
          {
            year: CURRENT_YEAR,
            placesAutorisees: 10,
            qpv: false,
            logementSocial: false,
          },
        ],
      },
    ],
  };
};

export const createModificationFinancesValidStructure = (id: number) =>
  createFinalisationFinanceValidStructure(id);

type CreateStructuresArgs = {
  id: number;
  adresseAdministrative?: string;
  structureTypologies?: StructureTypologieApiType[];
  structureMillesimes?: StructureMillesimeApiType[];
  adresses?: AdresseApiType[];
  type?: StructureType;
  finessCode?: string;
  publicType?: PublicType;
  cpomStructures?: CpomStructureApiType[];
  dnaStructures?: DnaStructureApiType[];
  finesses?: FinessApiType[];
  forms?: FormApiType[];
};
