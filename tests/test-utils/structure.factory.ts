import { CURRENT_YEAR } from "@/constants";
import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { FinessApiType } from "@/schemas/api/finess.schema";
import { FormApiType } from "@/schemas/api/form.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
import { Repartition } from "@/types/adresse.type";
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
  return {
    id,
    codeBhasile: `BHA-${id}`,
    operateur: { structureDnaCode: `C000${id}`, id: 1, name: "Adoma" },
    filiale: undefined,
    operateurLabel: "Adoma",
    type: type ?? StructureType.CADA,
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
    public: publicType ?? PublicType.TOUT_PUBLIC,
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
        formSteps: [
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
        ],
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
    isAutorisee: type === StructureType.CADA || type === StructureType.CPH,
    isSubventionnee: type === StructureType.HUDA || type === StructureType.CAES,
    currentPlaces: {
      placesAutorisees: structureTypologies?.[0]?.placesAutorisees ?? 0,
      qpv: 0,
      logementsSociaux: 0,
    },
    isInCpom: false,
    isInCpomPerYear: {},
  };
};

type CreateStructuresArgs = {
  id: number;
  adresseAdministrative?: string;
  structureTypologies?: StructureTypologieApiType[];
  structureMillesimes?: StructureMillesimeApiType[];
  adresses?: AdresseApiType[];
  type?: StructureType;
  finessCode?: string;
  publicType?: PublicType;
  cpomStructures?: CpomStructureApiRead[];
  dnaStructures?: DnaStructureApiType[];
  finesses?: FinessApiType[];
  forms?: FormApiType[];
};
