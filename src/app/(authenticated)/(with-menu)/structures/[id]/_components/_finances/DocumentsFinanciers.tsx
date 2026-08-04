import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { ReactElement } from "react";

import { DownloadItem } from "@/app/components/common/DownloadItem";
import { getYearFromDate, getYearRange } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const DocumentsFinanciers = (): ReactElement => {
  const { structure } = useStructureContext();

  const { budgets, documentsFinanciers, structureMillesimes } = structure;

  const { years } = getYearRange();

  const startYear = structure.date303
    ? getYearFromDate(structure.date303)
    : structure.creationDate
      ? getYearFromDate(structure.creationDate)
      : undefined;

  const yearsToDisplay = years.filter((year) => year >= (startYear ?? 0));

  const inheritedDocumentsFinanciers =
    structure.cpomStructures
      ?.flatMap((cpomStructure) => cpomStructure.cpom?.documentsFinanciers ?? [])
      .filter(
        (documentFinancier) =>
          documentFinancier.structureType === structure.type
      ) ?? [];

  return (
    <>
      {yearsToDisplay.map((year) => {
        const budget = budgets?.find((budget) => budget.year === year);
        const structureMillesime = structureMillesimes?.find(
          (structureMillesime) => structureMillesime.year === year
        );
        const ownDocuments =
          documentsFinanciers?.filter(
            (documentFinancier) => documentFinancier.year === year
          ) ?? [];
        const inheritedDocuments = inheritedDocumentsFinanciers.filter(
          (documentFinancier) => documentFinancier.year === year
        );

        if (
          !budget &&
          ownDocuments.length === 0 &&
          inheritedDocuments.length === 0
        ) {
          return null;
        }

        return (
          <Accordion label={year} key={year}>
            <div className="grid grid-cols-3 gap-4">
              {ownDocuments.length === 0 && inheritedDocuments.length === 0 ? (
                <span>Aucun document importé</span>
              ) : (
                <>
                  {ownDocuments.map((documentFinancier) => (
                    <div key={documentFinancier.id} className="pb-5">
                      <DownloadItem item={documentFinancier} />
                    </div>
                  ))}
                  {inheritedDocuments.map((documentFinancier) => (
                    <div key={`cpom-${documentFinancier.id}`} className="pb-5">
                      <DownloadItem item={documentFinancier} cpomInherited />
                    </div>
                  ))}
                </>
              )}
            </div>
            {structureMillesime?.operateurComment ? (
              <p className="text-sm text-default-grey mb-0">
                <strong>Commentaire</strong>
                <br />
                {structureMillesime.operateurComment}
              </p>
            ) : null}
          </Accordion>
        );
      })}
    </>
  );
};
