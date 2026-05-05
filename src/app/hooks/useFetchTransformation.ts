import { useEffect, useState } from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

export const useFetchTransformation = (id?: number) => {
  const [transformation, setTransformation] = useState<
    TransformationApiRead | undefined
  >(undefined);

  const getTransformation = async (
    id: number
  ): Promise<TransformationApiRead | undefined> => {
    try {
      const baseUrl = process.env.NEXT_URL || "";
      const result = await fetch(`${baseUrl}/api/transformations/${id}`);

      if (!result.ok) {
        throw new Error(`Failed to fetch transformation: ${result.status}`);
      }

      return await result.json();
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
