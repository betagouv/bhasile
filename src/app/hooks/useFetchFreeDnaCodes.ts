import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FreeDnaCode, FreeDnaCodeFilters } from "@/types/dna.type";
import { EntityId } from "@/types/Entity.type";

export const useFetchFreeDnaCodes = ({
  entityId,
  operateurId,
  departementAdministratif,
  type,
}: FreeDnaCodeFilters & {
  entityId?: EntityId;
} = {}) => {
  const { structureId, structureVersionId } = entityId ?? {};
  const { transformationId } = useParams<{ transformationId?: string }>();
  const [freeDnaCodes, setFreeDnaCodes] = useState<FreeDnaCode[]>();

  useEffect(() => {
    let isStale = false;

    const fetchFreeDnaCodes = async () => {
      setFreeDnaCodes(undefined);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

      const params = new URLSearchParams();
      if (structureId) {
        params.append("structureId", String(structureId));
      }
      if (structureVersionId) {
        params.append("structureVersionId", String(structureVersionId));
      }
      if (transformationId) {
        params.append("transformationId", transformationId);
      }
      if (operateurId) {
        params.append("operateurId", String(operateurId));
      }
      if (departementAdministratif) {
        params.append("departementAdministratif", departementAdministratif);
      }
      if (type) {
        params.append("type", type);
      }

      const result = await fetch(
        `${baseUrl}/api/dna-codes?${params.toString()}`
      );
      if (!result.ok) {
        return;
      }
      const data = await result.json();

      if (!isStale) {
        setFreeDnaCodes(data);
      }
    };
    fetchFreeDnaCodes();

    return () => {
      isStale = true;
    };
  }, [
    structureId,
    structureVersionId,
    transformationId,
    operateurId,
    departementAdministratif,
    type,
  ]);

  return { freeDnaCodes };
};
