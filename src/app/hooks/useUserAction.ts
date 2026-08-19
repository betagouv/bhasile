import { ApiError, extractApiError } from "../utils/apiError.util";

const postUserAction = async (url: string, body?: unknown): Promise<void> => {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new ApiError(await extractApiError(response), response.status);
  }
};

export const useUserAction = () => {
  const trackStatistiques = async (): Promise<void> => {
    postUserAction("/api/user-actions/statistiques");
  };

  const trackStatistiquesCartographie = async (): Promise<void> => {
    postUserAction("/api/user-actions/statistiques-cartographie");
  };

  const trackStructuresCartographie = async (): Promise<void> => {
    postUserAction("/api/user-actions/structures-cartographie");
  };

  const trackTypePlacesSpreadsheetExport = async (
    structureId: number
  ): Promise<void> => {
    postUserAction("/api/user-actions/type-places-spreadsheet-export", {
      structureId,
    });
  };

  const trackFinancesSpreadsheetExport = async (
    structureId: number
  ): Promise<void> => {
    postUserAction("/api/user-actions/finances-spreadsheet-export", {
      structureId,
    });
  };

  const trackControleQualiteSpreadsheetExport = async (
    structureId: number
  ): Promise<void> => {
    postUserAction("/api/user-actions/controle-qualite-spreadsheet-export", {
      structureId,
    });
  };

  const trackStructureSpreadsheetExport = async (
    structureId: number
  ): Promise<void> => {
    postUserAction("/api/user-actions/structure-spreadsheet-export", {
      structureId,
    });
  };

  return {
    trackStatistiques,
    trackStatistiquesCartographie,
    trackStructuresCartographie,
    trackTypePlacesSpreadsheetExport,
    trackFinancesSpreadsheetExport,
    trackControleQualiteSpreadsheetExport,
    trackStructureSpreadsheetExport,
  };
};
