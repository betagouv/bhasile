import { useEffect, useState } from "react";

import { StructureMinimalApiType } from "@/schemas/api/structure.schema";

export const useStructuresSelection = ({
  operateurName,
  departements,
  types,
  finalisedOnly,
}: Props) => {
  const [structures, setStructures] = useState<
    StructureMinimalApiType[] | undefined
  >(undefined);

  const getStructures = async (
    operateurName?: string,
    departements?: string,
    types?: string,
    finalisedOnly?: boolean
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
      if (departements && departements.length > 0) {
        params.append("departements", departements);
      }
      if (types && types.length > 0) {
        params.append("type", types);
      }
      params.append("selection", "true");
      if (finalisedOnly) {
        params.append("finalised", "true");
      }
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
        types,
        finalisedOnly
      );
      setStructures(structures);
    };
    if (operateurName && departements && types) {
      fetchStructures();
    } else {
      setStructures(undefined);
    }
  }, [operateurName, departements, types, finalisedOnly]);

  return {
    structures,
  };
};

type Props = {
  operateurName?: string;
  departements?: string;
  types?: string;
  finalisedOnly?: boolean;
};
