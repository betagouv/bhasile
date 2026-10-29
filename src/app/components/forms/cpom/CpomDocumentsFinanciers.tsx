import { ReactElement } from "react";

import { DocumentsFinanciersAccordion } from "@/app/components/forms/finance/documents/DocumentsFinanciersAccordion";
import { DocumentsFinanciersGrid } from "@/app/components/forms/finance/documents/DocumentsFinanciersGrid";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { useCpomContext } from "@/contexts/CpomContext";
import { StructureType } from "@/types/structure.type";

export const CpomDocumentsFinanciers = ({
  structureType,
}: Props): ReactElement => {
  const { cpom } = useCpomContext();

  const isAutorisee = isStructureAutorisee(structureType);
  const { years } = getYearRange();
  const startYear = getYearFromDate(cpom.dateStart);

  return (
    <>
      <MaxSizeNotice />
      {years.map((year) => (
        <DocumentsFinanciersAccordion
          key={year}
          year={year}
          startYear={startYear}
          hasAccordion
        >
          <DocumentsFinanciersGrid
            year={year}
            isAutorisee={isAutorisee}
            structureType={structureType}
            hasRequirement={false}
          />
        </DocumentsFinanciersAccordion>
      ))}
    </>
  );
};

type Props = {
  structureType: StructureType;
};
