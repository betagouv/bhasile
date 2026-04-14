import { CpomApiType } from "@/schemas/api/cpom.schema";

export const CpomGranularity = [
  "DEPARTEMENTALE",
  "INTERDEPARTEMENTALE",
  "REGIONALE",
] as const;

export type CpomGranularity = (typeof CpomGranularity)[number];

export type CpomViewType = CpomApiType & {
  dateStart?: string;
  dateEnd?: string;
};
