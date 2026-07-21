import { fr } from "@codegouvfr/react-dsfr";
import { ReactElement } from "react";

import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { StructureType } from "@/types/structure.type";

import { DocumentsFinanciersCategory } from "./DocumentsFinanciersCategory";

export const DocumentsFinanciersList = ({
  isAutorisee,
  year,
  structureType,
  hideRequirement,
}: Props): ReactElement => {
  const documentTypes = isAutorisee
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;

  return (
    <div className={fr.cx("fr-accordions-group")}>
      {documentTypes.map((documentType) => (
        <DocumentsFinanciersCategory
          documentType={documentType}
          key={documentType.value}
          year={year}
          structureType={structureType}
          hideRequirement={hideRequirement}
        />
      ))}
    </div>
  );
};

type Props = {
  isAutorisee: boolean;
  year: number;
  structureType?: StructureType;
  hideRequirement?: boolean;
};
