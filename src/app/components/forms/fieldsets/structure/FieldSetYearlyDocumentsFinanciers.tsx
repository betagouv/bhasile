import Notice from "@codegouvfr/react-dsfr/Notice";
import { ReactElement, useCallback, useEffect, useRef } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { getMillesimeIndexForAYear } from "@/app/utils/structure.util";
import { StructureMillesimeApiType } from "@/schemas/api/structure-millesime.schema";
import {
  DocumentFinancierFlexibleFormValues,
  DocumentsFinanciersFlexibleFormValues,
} from "@/schemas/forms/base/documentFinancier.schema";
import { FormKind } from "@/types/global";

import { DocumentsFinanciersCheckboxIsInCpom } from "../../finance/documents/DocumentsFinanciersCheckboxIsInCpom";
import { DocumentsFinanciersCommentaire } from "../../finance/documents/DocumentsFinanciersCommentaire";
import { DocumentsFinanciersCpomDisclaimer } from "../../finance/documents/DocumentsFinanciersCpomDisclaimer";
import { DocumentsFinanciersList } from "../../finance/documents/DocumentsFinanciersList";
import { YearlyFileUpload } from "../../finance/documents/YearlyFileUpload";

export const FieldSetYearlyDocumentsFinanciers = ({
  year,
  startYear,
  isAutorisee,
  control,
  hasAccordion,
  formKind,
}: Props): ReactElement | null => {
  const { watch, formState } = useFormContext();

  const { deleteFile } = useFileUpload();

  const structureMillesimes = watch(
    "structureMillesimes"
  ) as StructureMillesimeApiType[];

  const index = getMillesimeIndexForAYear(structureMillesimes, year);

  const documentsFinanciers: DocumentFinancierFlexibleFormValues[] = watch(
    "documentsFinanciers"
  );

  const { remove } = useFieldArray({
    control,
    name: "documentsFinanciers",
  });

  const isInCpom = watch(`structureMillesimes.${index}.cpom`);

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

  const removeCpomDocuments = useCallback(async () => {
    const indicesToRemove: number[] = [];

    for (const [index, document] of documentsFinanciers.entries()) {
      const documentYear = document.date?.substring(0, 4);
      if (
        documentYear === year.toString() &&
        document.granularity &&
        document.granularity !== "STRUCTURE"
      ) {
        if (document.key) {
          await deleteFile(document.key);
        }
        indicesToRemove.push(index);
      }
    }

    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach((indexToRemove) => {
      remove(indexToRemove);
    });
  }, [documentsFinanciers, year, deleteFile, remove]);

  useEffect(() => {
    if (!isInCpom && documentsFinanciers?.length > 0) {
      removeCpomDocuments();
    }
  }, [documentsFinanciers, isInCpom, removeCpomDocuments]);

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
        <p className=" text-default-error flex items-center gap-2">
          <i
            className="fr-icon-error-fill text-default-error"
            aria-hidden="true"
          />
          Veuillez importer les documents financiers requis concernant cette
          année.
        </p>
      )}

      {formKind === FormKind.AJOUT ? (
        <DocumentsFinanciersCheckboxIsInCpom year={year} index={index} />
      ) : (
        <DocumentsFinanciersCpomDisclaimer year={year} />
      )}

      {isInCpom && (
        <Notice
          severity="info"
          title=""
          className="rounded [&_p]:flex [&_p]:items-center mb-10"
          description="Selon vos pratiques, les documents financiers de cette année peuvent être à l’échelle de la structure et/ou du CPOM et/ou regrouper les deux. Veuillez importer tous les documents en votre possession en précisant leur échelle."
        />
      )}

      <div className="grid grid-cols-2 gap-16 mb-10">
        <DocumentsFinanciersList isAutorisee={isAutorisee} year={year} />
        <YearlyFileUpload
          year={year}
          index={index}
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
  formKind?: FormKind;
};
