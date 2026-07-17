import { ReactElement } from "react";
import { useFormContext } from "react-hook-form";

import { useCpomContext } from "@/app/(authenticated)/(with-menu)/cpoms/[id]/_context/CpomClientContext";
import { DocumentsFinanciersAccordion } from "@/app/components/forms/finance/documents/DocumentsFinanciersAccordion";
import { DocumentsFinanciersList } from "@/app/components/forms/finance/documents/DocumentsFinanciersList";
import { YearlyFileUpload } from "@/app/components/forms/finance/documents/YearlyFileUpload";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";

export const CpomDocumentsFinanciers = ({
  structureType,
}: Props): ReactElement => {
  const { cpom } = useCpomContext();
  const { control } = useFormContext<DocumentsFinanciersFlexibleFormValues>();

  const isAutorisee = isStructureAutorisee(structureType);
  const { years } = getYearRange();
  const startYear = getYearFromDate(cpom.dateStart);

  return (
    <div>
      <MaxSizeNotice />
      {years.map((year) => (
        <DocumentsFinanciersAccordion
          key={year}
          year={year}
          startYear={startYear}
          hasAccordion
        >
          <div className="grid grid-cols-2 gap-16">
            <DocumentsFinanciersList
              isAutorisee={isAutorisee}
              year={year}
              structureType={structureType}
              hideRequirement
            />
            <YearlyFileUpload
              year={year}
              isAutorisee={isAutorisee}
              control={control}
              structureType={structureType}
            />
          </div>
        </DocumentsFinanciersAccordion>
      ))}
    </div>
  );
};

type Props = {
  structureType: StructureType;
};
