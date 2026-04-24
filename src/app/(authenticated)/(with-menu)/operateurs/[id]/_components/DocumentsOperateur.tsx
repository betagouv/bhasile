import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { getDocumentsOperateurCategories } from "@/app/utils/documentOperateur.util";
import { DocumentOperateurCategory } from "@/types/document-operateur.type";

import FieldSetDocumentOperateur from "./FieldSetDocumentOperateur";

export const DocumentsOperateur = () => {
  const filteredCategories = Object.entries(getDocumentsOperateurCategories());

  return (
    <>
      <MaxSizeNotice />
      {filteredCategories.map(([category, rules], index) => {
        return (
          <div key={category}>
            <FieldSetDocumentOperateur
              category={category as DocumentOperateurCategory}
              categoryShortName={rules.categoryShortName}
              title={rules.title}
              canAddFile={rules.canAddFile}
              isOptional={rules.isOptional}
              additionalFieldsType={rules.additionalFieldsType}
              documentLabel={rules.documentLabel}
              addFileButtonLabel={rules.addFileButtonLabel}
            />
            {index < filteredCategories.length - 1 && <hr />}
          </div>
        );
      })}
    </>
  );
};
