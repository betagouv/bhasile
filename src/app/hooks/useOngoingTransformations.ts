import { useEffect, useState } from "react";

import { useFetchState } from "@/app/context/FetchStateContext";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";

export const useOngoingTransformations = () => {
  const [transformations, setTransformations] = useState<
    TransformationApiRead[]
  >([]);
  const { setFetchState } = useFetchState();

  useEffect(() => {
    const fetchOngoingTransformations = async () => {
      setFetchState("transformations", FetchState.LOADING);
      try {
        const baseUrl = process.env.NEXT_URL || "";
        const response = await fetch(`${baseUrl}/api/transformations`);
        if (!response.ok) {
          throw new Error(
            `Erreur lors de la récupération des transformations en cours: ${response.status}`
          );
        }
        setTransformations(await response.json());
        setFetchState("transformations", FetchState.IDLE);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des transformations en cours:",
          error
        );
        setTransformations([]);
        setFetchState("transformations", FetchState.ERROR);
      }
    };

    fetchOngoingTransformations();
  }, [setFetchState]);

  return { transformations };
};
