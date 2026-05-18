import { useEffect, useState } from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export const useFetchTransformation = (id?: number) => {
  const [transformation, setTransformation] = useState<
    TransformationApiRead | undefined
  >(undefined);

  const getTransformation = async (
    id: number
  ): Promise<TransformationApiRead | undefined> => {
    try {
      // TODO: connect to the real API route
      return {
        id,
        type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
        structureTransformations: [
          {
            id: 1,
            structureId: 1001,
            type: StructureTransformationType.FERMETURE,
          },
          {
            id: 2,
            structureId: 1003,
            type: StructureTransformationType.EXTENSION,
          },
          {
            id: 3,
            structureId: 1002,
            type: StructureTransformationType.FERMETURE,
          },
          {
            id: 4,
            structureId: 1003,
            type: StructureTransformationType.CONTRACTION,
          },
          {
            id: 5,
            structureId: 1004,
            type: StructureTransformationType.CREATION,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching transformation:", error);
      return undefined;
    }
  };

  useEffect(() => {
    const fetchTransformation = async (id: number) => {
      setTransformation(undefined);
      const transformation = await getTransformation(id);
      setTransformation(transformation);
    };

    if (id) {
      fetchTransformation(id);
    }
  }, [id]);

  return {
    transformation,
  };
};
