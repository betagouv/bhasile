import { ReactElement } from "react";
import { Control, useFormContext } from "react-hook-form";

import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { FormKind } from "@/types/global";

import { DocumentsFinanciersCheckboxIsInCpom } from "./DocumentsFinanciersCheckboxIsInCpom";
import { DocumentsFinanciersCommentaire } from "./DocumentsFinanciersCommentaire";
import { DocumentsFinanciersGrid } from "./DocumentsFinanciersGrid";

export const FieldSetYearlyDocumentsFinanciers = ({
  year,
  startYear,
  isAutorisee,
  control,
  hasAccordion,
  coveredDocumentsFinanciers,
  formKind,
}: Props): ReactElement | null => {
  const { watch, formState } = useFormContext();

  const structureMillesimes = watch(
    "structureMillesimes"
  ) as StructureMillesimeApiType[];

  const index = getMillesimeIndexForAYear(structureMillesimes, year);

  const yearErrors =
    formState.errors?.documentsFinanciers?.[
      String(year) as keyof typeof formState.errors.documentsFinanciers
    ];
  const hasYearError = !!yearErrors && Object.keys(yearErrors).length > 0;

  const shouldHide = startYear && Number(year) < startYear;
  if (shouldHide) {
    return null;
  }

  if (index === -1) {
    return null;
  }

  return (
    <fieldset>
      {!hasAccordion && (
        <h2 className="text-title-blue-france text-xl mb-6">{year}</h2>
      )}

      {formKind === FormKind.AJOUT && (
        <DocumentsFinanciersCheckboxIsInCpom year={year} index={index} />
      )}

      <DocumentsFinanciersGrid
        year={year}
        isAutorisee={isAutorisee}
        coveredDocumentsFinanciers={coveredDocumentsFinanciers}
        hasRequirement
        hasYearError={hasYearError}
      />
      <DocumentsFinanciersCommentaire
        year={year}
        index={index}
        control={control}
      />
      <hr className="mt-10 mb-8" />
    </fieldset>
  );
};

type Props = {
  year: number;
  startYear: number;
  isAutorisee: boolean;
  control: Control<DocumentsFinanciersFlexibleFormValues>;
  coveredDocumentsFinanciers?: DocumentFinancierApiType[];
  hasAccordion?: boolean;
  formKind?: FormKind;
};
