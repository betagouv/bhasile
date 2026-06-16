import { useEffect, useState } from "react";

import { EntityId } from "@/types/Entity.type";

export const useFetchFreeDnaCodes = ({
  entityId,
}: {
  entityId?: EntityId;
} = {}) => {
  const { structureId, structureVersionId } = entityId ?? {};
  const [freeDnaCodes, setFreeDnaCodes] = useState<{ code: string }[]>([]);

  useEffect(() => {
    const fetchFreeDnaCodes = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

      const params = new URLSearchParams();
      if (structureId) {
        params.append("structureId", String(structureId));
      }
      if (structureVersionId) {
        params.append("structureVersionId", String(structureVersionId));
      }

      const result = await fetch(
        `${baseUrl}/api/dna-codes?${params.toString()}`
      );
      const data = await result.json();

      setFreeDnaCodes(data);
    };
    fetchFreeDnaCodes();
  }, [structureId, structureVersionId]);

  return { freeDnaCodes };
};
