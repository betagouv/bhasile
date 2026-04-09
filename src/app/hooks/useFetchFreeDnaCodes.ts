import { useEffect, useState } from "react";

export const useFetchFreeDnaCodes = ({
  structureId,
}: {
  structureId: number;
}) => {
  const [freeDnaCodes, setFreeDnaCodes] = useState<{ code: string }[]>([]);

  useEffect(() => {
    const fetchFreeDnaCodes = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const result = await fetch(
        `${baseUrl}/api/dna-codes?free=true&structureId=${structureId}`
      );
      const data = await result.json();
      setFreeDnaCodes(data);
    };
    fetchFreeDnaCodes();
  }, [structureId]);

  return { freeDnaCodes };
};
