import { useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import {
  getDocumentsFinanciersYearRange,
  getYearFromDate,
} from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { FormKind } from "@/types/global";

import { FieldSetYearlyDocumentsFinanciers } from "../../fieldsets/structure/FieldSetYearlyDocumentsFinanciers";
import { DocumentsFinanciersAccordion } from "./DocumentsFinanciersAccordion";

export const DocumentsFinanciers = ({
  hasAccordion,
  formKind,
  className,
}: Props) => {
  const { structure } = useStructureContext();
  const { control } = useFormContext<DocumentsFinanciersFlexibleFormValues>();
  const isAutorisee = isStructureAutorisee(structure?.type);

  const startYear = getYearFromDate(
    structure?.date303 || structure?.creationDate
  );
  const { years } = getDocumentsFinanciersYearRange({
    isAutorisee,
  });

  const noYear = years.filter((year) => Number(year) >= startYear).length === 0;

  return (
    <div className={className}>
      <MaxSizeNotice />
      {noYear && (
        <p className="text-disabled-grey mb-0 text-sm col-span-3">
          La structure est trop récente et n’est pas en mesure de fournir de
          documents. Vous pouvez valider cette étape.
        </p>
      )}
      {years.map((year) => (
        <DocumentsFinanciersAccordion
          key={year}
          year={year}
          startYear={startYear}
          hasAccordion={hasAccordion}
        >
          <FieldSetYearlyDocumentsFinanciers
            key={year}
            year={year}
            startYear={startYear}
            isAutorisee={isAutorisee}
            control={control}
            hasAccordion={hasAccordion}
            formKind={formKind}
          />
        </DocumentsFinanciersAccordion>
      ))}
    </div>
  );
};

type Props = {
  hasAccordion?: boolean;
  formKind?: FormKind;
  className?: string;
};
