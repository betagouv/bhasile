import { useEffect, useState } from "react";

export const useFetchFreeDnaCodes = ({
  structureId,
}: {
  structureId?: number;
} = {}) => {
  const [freeDnaCodes, setFreeDnaCodes] = useState<{ code: string }[]>([]);

  useEffect(() => {
    const fetchFreeDnaCodes = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

      const params = new URLSearchParams();
      if (structureId) {
        params.append("structureId", String(structureId));
      }

      const result = await fetch(
        `${baseUrl}/api/dna-codes?${params.toString()}`
      );
      const data = await result.json();

      setFreeDnaCodes(data);
    };
    fetchFreeDnaCodes();
  }, [structureId]);

  return { freeDnaCodes };
};
