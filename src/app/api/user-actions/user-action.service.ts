import { after } from "next/server";
import { getServerSession } from "next-auth";

import { UserActionCategory, UserActionType } from "@/generated/prisma/enums";
import { authOptions } from "@/lib/next-auth/auth";

import { createUserAction } from "./user-action.repository";
import { getActionFromMethod } from "./user-action.util";

// Les fonctions de ce fichier sont asynchrones mais il faut les appeler sans
// await pour ne pas bloquer l'exécution de la requête principale

export const createStructureEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({ action: getActionFromMethod(method), structureId });
};

export const createCpomEvent = async (method: string, cpomId: number) => {
  await createUserAction({ action: getActionFromMethod(method), cpomId });
};

export const createOperateurEvent = async (
  method: string,
  operateurId: number
) => {
  await createUserAction({ action: getActionFromMethod(method), operateurId });
};

export const createReadEvent = async (target: ReadEventTarget) => {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return;
  }

  after(() =>
    createUserAction({
      action: UserActionCategory.READ,
      ...target,
      userEmail,
    })
  );
};

type ReadEventTarget = {
  structureId?: number;
  cpomId?: number;
  operateurId?: number;
};

export const createStatistiquesEvent = async (method: string) => {
  await createUserAction({
    action: getActionFromMethod(method),
    type: UserActionType.STATISTIQUES_TABLE,
  });
};

export const createStatistiquesCartographieEvent = async (method: string) => {
  await createUserAction({
    action: getActionFromMethod(method),
    type: UserActionType.STATISTIQUES_CARTOGRAPHIE,
  });
};

export const createStructuresCartographieEvent = async (method: string) => {
  await createUserAction({
    action: getActionFromMethod(method),
    type: UserActionType.STRUCTURES_CARTOGRAPHIE,
  });
};

export const createTypePlacesSpreadsheetExportEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({
    action: getActionFromMethod(method),
    structureId,
    type: UserActionType.TYPE_PLACES_SPREADSHEET_EXPORT,
  });
};

export const createFinancesSpreadsheetExportEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({
    action: getActionFromMethod(method),
    structureId,
    type: UserActionType.FINANCES_SPREADSHEET_EXPORT,
  });
};

export const createControleQualiteSpreadsheetExportEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({
    action: getActionFromMethod(method),
    structureId,
    type: UserActionType.CONTROLE_QUALITE_SPREADSHEET_EXPORT,
  });
};

export const createStructureSpreadsheetExportEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({
    action: getActionFromMethod(method),
    structureId,
    type: UserActionType.STRUCTURE_SPREADSHEET_EXPORT,
  });
};

export const createStructurePdfExportEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({
    action: getActionFromMethod(method),
    structureId,
    type: UserActionType.STRUCTURE_PDF_EXPORT,
  });
};

export const createStatistiquesSpreadsheetExportEvent = async (
  method: string,
  details?: Record<string, string>
) => {
  if (!details) {
    return;
  }
  await createUserAction({
    action: getActionFromMethod(method),
    type: UserActionType.STATISTIQUES_SPREADSHEET_EXPORT,
    details,
  });
};

export const createStatistiquesPdfExportEvent = async (
  method: string,
  details?: Record<string, string>
) => {
  if (!details) {
    return;
  }
  await createUserAction({
    action: getActionFromMethod(method),
    type: UserActionType.STATISTIQUES_PDF_EXPORT,
    details,
  });
};
