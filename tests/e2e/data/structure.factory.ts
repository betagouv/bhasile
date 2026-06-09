import { StructureType } from "@/types/structure.type";

import { uniqueCodeBhasile, uniqueDnaCode, uniqueFinessCode } from "./ids";

export type StructureSeedInput = {
  codeBhasile: string;
  type: StructureType;
  operateurId: number;
  nom: string;
  adresseAdministrative: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
  departementAdministratif?: string;
  creationDate: string;
  lgbt: boolean;
  fvvTeh: boolean;
  public: "TOUT_PUBLIC" | "FAMILLE" | "PERSONNES_ISOLEES";
  dnaCodes: { code: string }[];
  finessCode: string;
};

export const buildStructureSeed = (
  overrides: Partial<StructureSeedInput> = {}
): StructureSeedInput => {
  const codeBhasile = overrides.codeBhasile ?? uniqueCodeBhasile();
  return {
    codeBhasile,
    type: StructureType.CADA,
    operateurId: 1,
    nom: `Structure ${codeBhasile}`,
    adresseAdministrative: "1 rue de l'Asile",
    codePostalAdministratif: "75001",
    communeAdministrative: "Paris",
    departementAdministratif: "75",
    creationDate: "2020-01-01",
    lgbt: false,
    fvvTeh: false,
    public: "TOUT_PUBLIC",
    dnaCodes: [{ code: uniqueDnaCode() }],
    finessCode: uniqueFinessCode(),
    ...overrides,
  };
};
