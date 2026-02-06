import { useEffect, useState } from "react";

import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const useStructuresSelection = ({
  operateurName,
  departements,
  types,
}: Props) => {
  const [structures, setStructures] = useState<
    StructureMinimalApiType[] | undefined
  >(undefined);

  const getStructures = async (
    operateurName: string,
    departements: string,
    types: string
  ): Promise<{
    structures: StructureMinimalApiType[];
    totalStructures: number;
  }> => {
    try {
      const baseUrl = process.env.NEXT_URL || "";
      const params = new URLSearchParams();
      if (operateurName) {
        params.append("operateurs", operateurName);
      }
      if (departements.length > 0) {
        params.append("departements", departements);
      }
      if (types.length > 0) {
        params.append("type", types);
      }
      params.append("selection", "true");
      const result = await fetch(
        `${baseUrl}/api/structures?${params.toString()}`
      );

      if (!result.ok) {
        throw new Error(`Failed to fetch structures : ${result.status}`);
      }

      return await result.json();
    } catch (error) {
      console.error("Error fetching structures :", error);
      return { structures: [], totalStructures: 0 };
    }
  };

  useEffect(() => {
    const fetchStructures = async () => {
      const { structures } = await getStructures(
        operateurName,
        departements,
        types
      );
      setStructures(structures);
    };

    if (operateurName && departements && types) {
      fetchStructures();
    } else {
      setStructures([]);
    }
  }, [operateurName, departements, types]);

  return {
    structures,
  };
};

type Props = {
  operateurName: string;
  departements: string;
  types: string;
};
