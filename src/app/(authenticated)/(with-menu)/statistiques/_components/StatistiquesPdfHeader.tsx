import { ReactElement } from "react";

export const StatistiquesPdfHeader = ({
  zonesCount,
  operateursCount,
  typesCount,
}: Props): ReactElement => {
  const getSubtitle = (): string => {
    const allZonesLabel = "Toute la France";
    const allOperateursLabel = "tous les opérateurs";
    const allTypesLabel = "tous les types de structure";

    if (zonesCount === 0 && operateursCount === 0 && typesCount === 0) {
      return [allZonesLabel, allOperateursLabel, allTypesLabel].join(", ");
    }
    const zoneLabel = zonesCount === 0 ? allZonesLabel : `${zonesCount} zones`;
    const operateurLabel =
      operateursCount === 0
        ? allOperateursLabel
        : `${operateursCount} opérateurs`;
    const typeLabel =
      typesCount === 0 ? allTypesLabel : `${typesCount} types de structure`;
    const filtersLabel = [zoneLabel, operateurLabel, typeLabel].join(", ");
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
  zonesCount: number;
  operateursCount: number;
  typesCount: number;
};
