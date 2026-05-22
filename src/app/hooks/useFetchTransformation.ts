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
            type: StructureTransformationType.FERMETURE,
            structureVersion: { structureId: 1001 },
          },
          {
            id: 2,
            type: StructureTransformationType.EXTENSION,
            structureVersion: { structureId: 1003 },
          },
          {
            id: 3,
            type: StructureTransformationType.FERMETURE,
            structureVersion: { structureId: 1002 },
          },
          {
            id: 4,
            type: StructureTransformationType.CONTRACTION,
            structureVersion: { structureId: 1003 },
          },
          {
            id: 5,
            type: StructureTransformationType.CREATION,
            structureVersion: { structureId: 1004 },
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
