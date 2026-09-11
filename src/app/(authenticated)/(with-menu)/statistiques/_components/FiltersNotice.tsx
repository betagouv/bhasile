"use client";

import { ReactElement, useEffect, useState } from "react";

import {
  OperateurSuggestion,
  useOperateurSuggestion,
} from "@/app/hooks/useOperateurSuggestion";
import { DEPARTEMENTS } from "@/constants";

type Props = {
  departements: string | null | undefined;
  operateurs: string | null | undefined;
  types: string | null | undefined;
};

export const FiltersNotice = ({
  departements,
  operateurs,
  types,
}: Props): ReactElement => {
  const [allOperateurs, setAllOperateurs] = useState<OperateurSuggestion[]>([]);
  const { getAllOperateurs } = useOperateurSuggestion();

  useEffect(() => {
    const fetchOperateurs = async () => {
      const operateurs = await getAllOperateurs();
      setAllOperateurs(operateurs);
    };
    fetchOperateurs();
  }, [getAllOperateurs]);

  const getDepartementsLabel = (): string => {
    const departementsNumeros = departements?.split(",");
    const departementsLabels = departementsNumeros?.map((departementNumero) => {
      const currentDepartement = DEPARTEMENTS.find(
        (departementItem) => departementItem.numero === departementNumero
      );
      return currentDepartement?.name;
    });
    return departementsLabels?.join(", ") || "Toute la France";
  };

  const getOperateursLabel = (): string => {
    if (!operateurs) {
      return "Tous les opérateurs";
    }
    const operateursIds = operateurs.split(",");
    const operateurLabels = operateursIds.map((operateurId) => {
      const currentOperateur = allOperateurs.find((operateurItem) => {
        return operateurItem.id === Number(operateurId);
      });
      return currentOperateur?.label;
    });
    return operateurLabels.join(", ");
  };

  const getTypesLabel = (): string => {
    return types?.replaceAll(",", ", ") || "Tous les types";
  };

  return (
    <span>
      <strong>* Départements : </strong>
      {getDepartementsLabel()} — <strong>Opérateurs : </strong>
      {getOperateursLabel()} — <strong>Types de structures : </strong>
      {getTypesLabel()}
    </span>
  );
};
