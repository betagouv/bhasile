import { ReactElement } from "react";

import { ActiviteBlock } from "./activite/ActiviteBlock";
import { ControleQualiteBlock } from "./controle-qualite/ControleQualiteBlock";
import { FiltersNotice } from "./FiltersNotice";
import { FinancesBlock } from "./finances/FinancesBlock";
import { RMUBlock } from "./rmu/RMUBlock";
import { StatistiquesPdfHeader } from "./StatistiquesPdfHeader";
import { StructuresBlock } from "./structures/StructuresBlock";
import { TypesPlacesBlock } from "./type-places/TypesPlacesBlock";

export type StatistiquesPdfExportPayload = {
  typePlacesFinancesStartYear: number;
  typePlacesFinancesEndYear: number;
  activiteStartMonth: string;
  activiteEndMonth: string;
};

export const StatistiquesPdfExportDocument = ({
  data,
  departements,
  operateurs,
  types,
}: Props): ReactElement => {
  console.log(">>>>>>>>>>>", data);
  const zonesCount = departements?.split(",").length || 0;
  const operateursCount = operateurs?.split(",").length || 0;
  const typesCount = types?.split(",").length || 0;

  return (
    <div className="p-14">
      <StatistiquesPdfHeader
        zonesCount={zonesCount}
        operateursCount={operateursCount}
        typesCount={typesCount}
      />
      <div className="pb-4 break-after-page">
        <StructuresBlock />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <TypesPlacesBlock />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <FinancesBlock />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <ControleQualiteBlock />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <ActiviteBlock />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <RMUBlock />
      </div>
      <FiltersNotice
        departements={departements}
        operateurs={operateurs}
        types={types}
      />
    </div>
  );
};

type Props = {
  data: StatistiquesPdfExportPayload;
  departements: string | null | undefined;
  operateurs: string | null | undefined;
  types: string | null | undefined;
};
