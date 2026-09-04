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
        <TypesPlacesBlock
          startYear={data.typePlacesFinancesStartYear}
          endYear={data.typePlacesFinancesEndYear}
        />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <FinancesBlock
          startYear={data.typePlacesFinancesStartYear}
          endYear={data.typePlacesFinancesEndYear}
        />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <ControleQualiteBlock
          startYear={data.typePlacesFinancesStartYear}
          endYear={data.typePlacesFinancesEndYear}
        />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4 break-after-page">
        <ActiviteBlock
          startMonth={data.activiteStartMonth}
          endMonth={data.activiteEndMonth}
        />
      </div>
      <div className="pt-14">
        <StatistiquesPdfHeader
          zonesCount={zonesCount}
          operateursCount={operateursCount}
          typesCount={typesCount}
        />
      </div>
      <div className="pb-4">
        <RMUBlock
          startMonth={data.activiteStartMonth}
          endMonth={data.activiteEndMonth}
        />
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
