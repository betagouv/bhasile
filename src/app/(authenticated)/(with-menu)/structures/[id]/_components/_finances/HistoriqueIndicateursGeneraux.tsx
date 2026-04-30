import { CustomAccordion } from "@/app/components/common/CustomAccordion";
import { Table } from "@/app/components/common/Table";
import { getIndicateurFinancierTableLines } from "@/app/components/forms/finance/budget-tables/getIndicateurFinancierTableLines";
import { IndicateurFinancierTableLines } from "@/app/components/forms/finance/budget-tables/IndicateurFinancierTableLines";
import { getYearRange } from "@/app/utils/date.util";
import { getRealCreationYear } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { getIndicateurFinancierStaticTableHeading } from "./getIndicateurFinancierStaticTableHeading";

export const HistoriqueIndicateursGeneraux = () => {
  const { structure } = useStructureContext();

  const indicateursFinanciers = structure.indicateursFinanciers;

  const { years } = getYearRange({ order: "desc" });
  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  if (!indicateursFinanciers) {
    return null;
  }

  return (
    <CustomAccordion
      label={
        structure.isAutorisee
          ? "Historique selon compte administratif"
          : "Historique selon compte-rendu financier"
      }
    >
      <Table
        ariaLabelledBy=""
        headings={getIndicateurFinancierStaticTableHeading({
          years: yearsToDisplay,
          indicateursFinanciers: indicateursFinanciers,
        })}
        enableBorders
        stickFirstColumn
      >
        <IndicateurFinancierTableLines
          lines={getIndicateurFinancierTableLines()}
          years={yearsToDisplay}
          indicateursFinanciers={indicateursFinanciers}
          canEdit={false}
        />
      </Table>
    </CustomAccordion>
  );
};
