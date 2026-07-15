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

export type DashboardTransformationStatus = "A_INITIALISER" | "A_FINALISER";

export type DashboardTransformationRow = {
  transformationId: number;
  operateurName: string | null;
  departementAdministratif: string;
  summary: string;
  status: DashboardTransformationStatus;
  updatedAt: string | null;
  actionUrl: string;
};

export type RappelEchelle = "STRUCTURE" | "CPOM";

export type RappelCriticite = "IMPORTANT" | "URGENT";

export type RappelTaskType =
  | "RENOUVELLEMENT_AUTORISATION"
  | "RENOUVELLEMENT_CONVENTION"
  | "EVALUATION"
  | "RENOUVELLEMENT_CPOM";

export type RappelGroupBy = "STRUCTURE" | "CPOM" | "TASK" | "CRITICITE";

export type DashboardRappel = {
  id: string;
  echelle: RappelEchelle;
  taskType: RappelTaskType;
  taskLabel: string;
  deadline: string | null;
  criticite: RappelCriticite;
  actionUrl: string;

  structureId: number | null;
  structureCodeBhasile: string | null;
  structureType: StructureType | null;
  structureCommune: string | null;
  structureDepartement: string | null;
  operateurName: string | null;

  cpomId: number | null;
  cpomLabel: string | null;
  cpomDepartements: string[];
};

export type RappelGroupHeader =
  | {
      kind: "STRUCTURE";
      structureCodeBhasile: string | null;
      structureType: StructureType | null;
      operateurName: string | null;
      structureCommune: string | null;
      structureDepartement: string | null;
    }
  | { kind: "CPOM"; cpomLabel: string | null; cpomDepartements: string[] }
  | { kind: "TASK"; taskType: RappelTaskType; taskLabel: string }
  | { kind: "CRITICITE"; criticite: RappelCriticite };

type RappelGroupNodeBase = {
  key: string;
  header: RappelGroupHeader;
  importantCount: number;
  urgentCount: number;
};

export type RappelGroupNode =
  | (RappelGroupNodeBase & { children: RappelGroupNode[] })
  | (RappelGroupNodeBase & { rappels: DashboardRappel[] });
