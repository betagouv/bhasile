import type { StructureType } from "@/generated/prisma/client";

export type InitialisationStatus =
  | "A_INITIALISER"
  | "A_FINALISER"
  | "FINALISEE";

export type ActualisationStatus = "A_DEBUTER" | "EN_COURS" | "FINALISEE";

export type DashboardStructureRow = {
  id: number;
  codeBhasile: string | null;
  type: StructureType | null;
  operateurName: string | null;
  communeAdministrative: string | null;
  departementAdministratif: string | null;
  initialisationStatus: InitialisationStatus;
  actualisationStatus: ActualisationStatus;
  actionUrl: string | null;
};

export type InitialisationsActualisationsApiRead = {
  initialisationDeadline: string | null;
  actualisationDeadline: string | null;
  total: number;
  rows: DashboardStructureRow[];
};
