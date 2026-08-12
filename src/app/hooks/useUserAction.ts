import { ApiError, extractApiError } from "../utils/apiError.util";

const postUserAction = async (url: string): Promise<void> => {
  const response = await fetch(url, {
    method: "POST",
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

  return { trackStatistiques, trackStatistiquesCartographie };
};
