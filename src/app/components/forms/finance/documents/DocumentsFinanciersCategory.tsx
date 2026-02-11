import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";
import { useFormContext } from "react-hook-form";

import { cn } from "@/app/utils/classname.util";
import { CURRENT_YEAR } from "@/constants";
import { DocumentFinancierFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

import { DocumentsFinanciersItem } from "./DocumentsFinanciersItem";
import { StructureDocument } from "./documentsStructures";

export const DocumentsFinanciersCategory = ({
  documentType,
  year,
}: Props): ReactElement => {
  const { watch } = useFormContext();

  const documentsFinanciers: DocumentFinancierFlexibleFormValues[] = watch(
    "documentsFinanciers"
  );

  const documentsFinanciersOfCategory =
    documentsFinanciers?.filter(
      (documentFinancier) =>
        documentFinancier.category === documentType.value &&
        documentFinancier.year === year
    ) || [];

  const isFilled = documentsFinanciersOfCategory.length > 0;
  const isAllowedYear = year <= CURRENT_YEAR - documentType.yearIndex;

  return (
    <Accordion
      key={documentType.label}
      label={
        <div className="flex items-center gap-2 justify-between w-full">
          <div className={!isFilled ? "text-disabled-grey" : ""}>
            <div>
              <strong>{documentType.label}</strong>
              {!(documentType.required && isAllowedYear) && (
                <span
                  className={cn(
                    isFilled ? "text-default-grey" : "text-disabled-grey",
                    "italic"
                  )}
                >
                  {" "}
                  - optionnel
                </span>
              )}
            </div>
            <span className="text-sm ">{documentType.subLabel}</span>
          </div>
          {((documentType.required && isAllowedYear) || isFilled) && (
            <div
              className={cn(
                "uppercase text-[0.625rem]",
                isFilled ? "text-default-success" : "text-default-warning"
              )}
            >
              {isFilled ? "Importé" : "À importer"}
            </div>
          )}
        </div>
      }
      className={cn(
        !isFilled
          ? "[&>h3>button]:cursor-default [&>h3>button]:hover:bg-transparent [&>h3>button]:after:text-disabled-grey"
          : "",
        "[&>h3>button]:after:w-6 [&>h3>button]:after:h-6 [&>h3>button]:after:ml-2"
      )}
    >
      <div>
        {documentsFinanciersOfCategory.map((documentFinancier) => (
          <DocumentsFinanciersItem
            key={documentFinancier.fileUploads?.[0]?.key}
            documentFinancier={documentFinancier}
          />
        ))}
      </div>
    </Accordion>
  );
};

type Props = {
  documentType: StructureDocument;
  year: number;
};
