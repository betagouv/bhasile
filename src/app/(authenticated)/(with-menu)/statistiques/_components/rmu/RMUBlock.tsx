import { useSearchParams } from "next/navigation";

import { ACCEPTED_STRUCTURE_TYPES } from "@/types/structure.type";

import { RMUChart } from "./RMUChart";
import { RMUStatsTable } from "./RMUStatsTable";

export const RMUBlock = ({ startMonth, endMonth }: Props) => {
  const searchParams = useSearchParams();

  const operatorFilterValue = searchParams.get("operateurs");
  const typeFilterValue = searchParams.get("types");

  const selectedTypes = typeFilterValue
    ? typeFilterValue.split(",").filter(Boolean)
    : [];

  const areAllTypesSelected =
    ACCEPTED_STRUCTURE_TYPES.length > 0 &&
    ACCEPTED_STRUCTURE_TYPES.every((structureType) =>
      selectedTypes.includes(structureType)
    );

  const hasActiveTypeFilter = selectedTypes.length > 0 && !areAllTypesSelected;

  const hasActiveOperatorFilter =
    operatorFilterValue !== null && operatorFilterValue !== "";

  const noFiltersSelected = !hasActiveTypeFilter && !hasActiveOperatorFilter;

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex justify-between">
          <span className="text-title-blue-france mr-3 fr-icon-article-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">
            Référés Mesures Utiles
          </h3>
        </div>
        {!noFiltersSelected && (
          <div className="text-title-blue-france">
            Ces données ne peuvent pas être affinées par opérateur ou type de
            structure.
          </div>
        )}
      </div>
      {noFiltersSelected && (
        <div className="pb-16">
          <RMUChart startMonth={startMonth} endMonth={endMonth} />
        </div>
      )}
      {noFiltersSelected && (
        <RMUStatsTable startMonth={startMonth} endMonth={endMonth} />
      )}
    </div>
  );
};

type Props = {
  startMonth?: string;
  endMonth?: string;
};
