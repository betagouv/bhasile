import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";

import { DownloadItem } from "@/app/components/common/DownloadItem";
import {
  getDocumentsFinanciersYearRange,
  getYearFromDate,
} from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  DocumentFinancierCategory,
  DocumentFinancierCategoryType,
} from "@/types/file-upload.type";

import { useStructureContext } from "../../_context/StructureClientContext";

export const DocumentsAdministratifs = (): ReactElement => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure.type);
  const { years } = getDocumentsFinanciersYearRange({ isAutorisee });

  const startYear = structure.date303
    ? getYearFromDate(structure.date303)
    : structure.creationDate
      ? getYearFromDate(structure.creationDate)
      : undefined;

  const yearsToDisplay = years.filter((year) => year >= (startYear ?? 0));

  const getDocumentsFinanciersToDisplay = (budget: BudgetApiType) => {
    return (structure.documentsFinanciers || [])?.filter(
      (documentFinancier) => {
        const isSameYear =
          getYearFromDate(documentFinancier.date) === budget.year;
        const isOperateurCategory = DocumentFinancierCategory.includes(
          documentFinancier.category as DocumentFinancierCategoryType[number]
        );
        return isSameYear && isOperateurCategory;
      }
    );
  };

  return (
    <>
      {yearsToDisplay.map((year) => {
        const budget = structure.budgets?.find(
          (budget) => budget.year === year
        );
        return budget ? (
          <Accordion label={budget.year} key={budget.id}>
            <div className="columns-3">
              {getDocumentsFinanciersToDisplay(budget)?.length === 0 ? (
                <span>Aucun document importé</span>
              ) : (
                getDocumentsFinanciersToDisplay(budget).map(
                  (documentFinancier) => (
                    <div key={documentFinancier.key} className="pb-5">
                      <DownloadItem
                        fileUpload={documentFinancier}
                        displayGranularity={true}
                      />
                    </div>
                  )
                )
              )}
            </div>
          </Accordion>
        ) : null;
      })}
    </>
  );
};
