import { useParams } from "next/navigation";
import { ReactElement } from "react";

import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { DOCUMENTS_FINANCIERS_OPEN_YEAR } from "@/constants";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

export const DocumentsFinanciers = (): ReactElement => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<DocumentsFinanciersFlexibleFormValues>
  >(`ajout-structure-${params.id}-documents`, {});

  const { currentValue: identificationValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.id}-identification`, {});

  const isAutorisee = isStructureAutorisee(identificationValues?.type);

  const documents = isAutorisee
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;

  const { years } = getYearRange();

  const startYear = localStorageValues?.date303
    ? Number(localStorageValues?.date303?.split("/")?.[2])
    : Number(identificationValues?.creationDate?.split("/")?.[2]);

  const yearsToCheck = years.filter((year) => {
    return year >= startYear;
  });

  const numberOfMissingDocuments = yearsToCheck.flatMap((year) => {
    const yearIndex = DOCUMENTS_FINANCIERS_OPEN_YEAR - year + 1;
    const documentsFinanciers = localStorageValues?.documentsFinanciers ?? [];

    return documents.filter((document) => {
      if (!document.required || document.yearIndex > yearIndex) {
        return false;
      }

      const hasDocument = documentsFinanciers.some(
        (documentFinancier) =>
          documentFinancier.category === document.value &&
          documentFinancier.year === year &&
          documentFinancier.fileUploads?.[0]?.key
      );
      return !hasDocument;
    });
  }).length;

  if (numberOfMissingDocuments > 0) {
    return (
      <div className="flex items-center gap-3 max-w-md text-base font-normal">
        <span className="fr-icon-warning-line text-default-warning fr-icon--sm" />
        <p className="text-default-warning mb-0 italic">
          <strong>
            {numberOfMissingDocuments}{" "}
            {numberOfMissingDocuments > 1
              ? "documents obligatoires sont manquants"
              : "document obligatoire est manquant"}
            {" : "}
          </strong>
          un·e agent·e vous contactera rapidement pour débloquer la situation.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 max-w-md text-base font-normal">
      <span className="fr-icon-success-line text-title-blue-france fr-icon--sm" />
      <p className="text-title-blue-france mb-0 italic">
        Tous les documents obligatoires ont été transmis.
      </p>
    </div>
  );
};
