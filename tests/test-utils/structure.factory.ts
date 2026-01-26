import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { StructureApiType } from "@/schemas/api/structure.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";
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
}: CreateStructuresArgs): StructureApiType => {
  return {
    id,
    dnaCode: `C000${id}`,
    operateur: { structureDnaCode: `C000${id}`, id: 1, name: "Adoma" },
    filiale: undefined,
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
    public: publicType ?? ("TOUT_PUBLIC" as PublicType),
    debutPeriodeAutorisation: new Date("01/02/2022").toISOString(),
    finPeriodeAutorisation: new Date("01/02/2025").toISOString(),
    adresses: adresses ?? [],
    notes: "Note 1",
    structureTypologies: structureTypologies ?? [],
    structureMillesimes: structureMillesimes ?? [],
    cpomStructures: cpomStructures ?? [],
    forms: [],
    contacts: [],
    documentsFinanciers: [],
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
  cpomStructures?: CpomStructureApiType[];
};
