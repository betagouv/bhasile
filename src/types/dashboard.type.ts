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
