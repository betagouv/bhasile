export type Page = {
  params: Promise<{
    [key: string]: string;
  }>;
  searchParams: Promise<{
    [key: string]: string;
  }>;
};

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type ExcludeNullValues<T> = { [K in keyof T]: Exclude<T[K], null> };

export const FormKind = {
  AJOUT: "ajout",
  MODIFICATION: "modification",
  FINALISATION: "finalisation",
  ACTUALISATION: "actualisation",
  ADRESSES_RECOVERY: "adresses-recovery",
  OUVERTURE_EX_NIHILO: "ouverture-ex-nihilo",
  OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES:
    "ouverture-depuis-une-ou-plusieurs-structures",
  EXTENSION: "extension",
  CONTRACTION: "contraction",
} as const;

export type FormKind = (typeof FormKind)[keyof typeof FormKind];

export type SessionUser = {
  id: string;
  name: string;
  prenom: string;
  email: string;
  role: string;
  allowedDepartements: string[];
};
