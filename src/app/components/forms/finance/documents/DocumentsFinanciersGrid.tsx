import { ReactElement } from "react";

import { isDocumentCoveredByCpom } from "@/app/utils/document-financier.util";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";

import { AutresDocumentsFinanciers } from "./AutresDocumentsFinanciers";
import { DocumentFinancierBox } from "./DocumentFinancierBox";
import {
  isDocumentStillRequired,
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "./documentsStructures";

export const DocumentsFinanciersGrid = ({
  year,
  isAutorisee,
  structureType,
  coveredDocumentsFinanciers = [],
  hasRequirement,
  hasYearError = false,
}: Props): ReactElement => {
  const documentTypes = (
    isAutorisee
      ? structureAutoriseesDocuments
      : structureSubventionneesDocuments
  ).filter((documentType) => documentType.value !== "AUTRE_FINANCIER");

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
        {documentTypes.map((documentType) => (
          <DocumentFinancierBox
            key={documentType.value}
            documentType={documentType}
            year={year}
            structureType={structureType}
            isRequired={
              hasRequirement &&
              isDocumentStillRequired(
                documentType,
                year,
                coveredDocumentsFinanciers
              )
            }
            hasRequirementLabel={hasRequirement}
            isCoveredByCpom={isDocumentCoveredByCpom(
              coveredDocumentsFinanciers,
              documentType.value,
              year
            )}
            hasYearError={hasYearError}
          />
        ))}
      </div>
      <AutresDocumentsFinanciers year={year} structureType={structureType} />
    </>
  );
};

type Props = {
  year: number;
  isAutorisee: boolean;
  structureType?: StructureType;
  coveredDocumentsFinanciers?: DocumentFinancierApiType[];
  hasRequirement: boolean;
  hasYearError?: boolean;
};
