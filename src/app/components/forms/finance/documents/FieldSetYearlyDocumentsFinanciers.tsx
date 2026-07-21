import { ReactElement, useEffect, useRef } from "react";
import { Control, useFormContext } from "react-hook-form";

import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

import { DocumentsFinanciersCommentaire } from "./DocumentsFinanciersCommentaire";
import { DocumentsFinanciersList } from "./DocumentsFinanciersList";
import { YearlyFileUpload } from "./YearlyFileUpload";

export const FieldSetYearlyDocumentsFinanciers = ({
  year,
  startYear,
  isAutorisee,
  control,
  hasAccordion,
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
  const hasError = yearErrors && Object.keys(yearErrors).length > 0;

  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (hasError && fieldsetRef.current) {
      fieldsetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [hasError]);

  const shouldHide = startYear && Number(year) < startYear;
  if (shouldHide) {
    return null;
  }

  if (index === -1) {
    return null;
  }

  return (
    <fieldset ref={fieldsetRef}>
      {!hasAccordion && (
        <h2 className="text-title-blue-france text-xl mb-6">{year}</h2>
      )}
      {hasError && (
        <p className=" text-default-error flex items-center gap-2" data-form-error>
          <i
            className="fr-icon-error-fill text-default-error"
            aria-hidden="true"
          />
          Veuillez importer les documents financiers requis concernant cette
          année.
        </p>
      )}

      <div className="grid grid-cols-2 gap-16 mb-10">
        <DocumentsFinanciersList isAutorisee={isAutorisee} year={year} />
        <YearlyFileUpload
          year={year}
          isAutorisee={isAutorisee}
          control={control}
        />
      </div>
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
  hasAccordion?: boolean;
};
