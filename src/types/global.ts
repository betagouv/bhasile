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

export const FormKind = {
  AJOUT: "ajout",
  MODIFICATION: "modification",
  FINALISATION: "finalisation",
  ADRESSES_RECOVERY: "adresses-recovery",
} as const;

export type FormKind = (typeof FormKind)[keyof typeof FormKind];
