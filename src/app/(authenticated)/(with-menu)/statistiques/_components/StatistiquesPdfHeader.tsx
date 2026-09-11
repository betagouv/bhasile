import { ReactElement } from "react";

import { pluralize } from "@/app/utils/string.util";

export const StatistiquesPdfHeader = ({
  departementsCount,
  operateursCount,
  typesCount,
}: Props): ReactElement => {
  const getSubtitle = (): string => {
    const allDepartementsLabel = "Toute la France";
    const allOperateursLabel = "tous les opérateurs";
    const allTypesLabel = "tous les types de structure";

    if (departementsCount === 0 && operateursCount === 0 && typesCount === 0) {
      return [allDepartementsLabel, allOperateursLabel, allTypesLabel].join(
        ", "
      );
    }
    const departementLabel =
      departementsCount === 0
        ? allDepartementsLabel
        : `${departementsCount} ${pluralize(departementsCount, "département")}`;
    const operateurLabel =
      operateursCount === 0
        ? allOperateursLabel
        : `${operateursCount} ${pluralize(operateursCount, "opérateur")}`;
    const typeLabel =
      typesCount === 0
        ? allTypesLabel
        : `${typesCount} ${pluralize(typesCount, "type")} de structure`;
    const filtersLabel = [departementLabel, operateurLabel, typeLabel].join(
      ", "
    );
    return `Sélection personnalisée (${filtersLabel}) *`;
  };

  return (
    <div>
      <h1 className="uppercase text-xs mb-0 text-title-blue-france">
        Statistiques
      </h1>
      <h2 className="text-xl text-title-blue-france">{getSubtitle()}</h2>
    </div>
  );
};

type Props = {
  departementsCount: number;
  operateursCount: number;
  typesCount: number;
};
