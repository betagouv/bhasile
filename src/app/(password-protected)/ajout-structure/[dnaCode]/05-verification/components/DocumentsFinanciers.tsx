import { useParams } from "next/navigation";
import { ReactElement } from "react";

import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { getDocumentsFinanciersYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { CURRENT_OPEN_YEAR } from "@/constants";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";

export const DocumentsFinanciers = (): ReactElement => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<DocumentsFinanciersFlexibleFormValues>
  >(`ajout-structure-${params.dnaCode}-documents`, {});

  const { currentValue: identificationValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.dnaCode}-identification`, {});

  const isAutorisee = isStructureAutorisee(identificationValues?.type);

  const documents = isAutorisee
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;

  const { years } = getDocumentsFinanciersYearRange({ isAutorisee });

  const startYear = localStorageValues?.date303
    ? Number(localStorageValues?.date303?.split("/")?.[2])
    : Number(identificationValues?.creationDate?.split("/")?.[2]);

  const yearsToCheck = years.filter((year) => {
    return Number(year) >= Number(startYear);
  });

  const numberOfMissingDocuments = yearsToCheck
    .map((year) =>
      documents
        .filter((document) => {
          const yearIndex = CURRENT_OPEN_YEAR - year;

          if (!document.required || document.yearIndex > yearIndex) {
            return false;
          }

          const documentsFinanciers =
            localStorageValues?.documentsFinanciers ?? [];
          const findDocument = documentsFinanciers.find(
            (documentFinancier) =>
              documentFinancier.category === document.value &&
              documentFinancier.year === year &&
              documentFinancier.fileUploads?.[0]?.key
          );
          return !findDocument ? 1 : 0;
        })
        .reduce((accumulator: number) => accumulator + 1, 0)
    )
    .reduce((accumulator: number, current: number) => accumulator + current, 0);

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
