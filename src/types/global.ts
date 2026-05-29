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
  ADRESSES_RECOVERY: "adresses-recovery",
  CREATION_EX_NIHILO: "creation-ex-nihilo",
  CREATION_FROM_STRUCTURE: "creation-from-structure",
} as const;

export type FormKind = (typeof FormKind)[keyof typeof FormKind];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedDepartements: string[];
};
