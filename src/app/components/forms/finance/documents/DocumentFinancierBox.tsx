import { ReactElement, useId } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { FileUploadBox } from "@/app/components/forms/FileUploadBox";
import { UploadItem } from "@/app/components/forms/UploadItem";
import { FileUploadResponse } from "@/app/hooks/useFileUpload";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";
import {
  addDocumentFinancierFileToSlot,
  findDocumentFinancierWithFile,
  removeDocumentFinancierByFileKey,
} from "@/utils/document-financier-form.util";

import { StructureDocument } from "./documentsStructures";

export const DocumentFinancierBox = ({
  documentType,
  year,
  structureType,
  isRequired,
  hasRequirementLabel,
  isCoveredByCpom = false,
  hasYearError = false,
}: Props): ReactElement => {
  const titleId = useId();
  const { control, getValues, setValue } =
    useFormContext<DocumentsFinanciersFlexibleFormValues>();
  const documentsFinanciers =
    useWatch({ control, name: "documentsFinanciers" }) ?? [];

  const slot = { year, category: documentType.value, structureType };
  const documentFinancier = findDocumentFinancierWithFile(
    documentsFinanciers,
    slot
  );
  const fileUpload = documentFinancier?.fileUploads?.[0];

  const hasMissingRequiredError = hasYearError && isRequired && !fileUpload;

  const handleUpload = (uploadedFile: FileUploadResponse) => {
    setValue(
      "documentsFinanciers",
      addDocumentFinancierFileToSlot(
        getValues("documentsFinanciers") ?? [],
        slot,
        uploadedFile,
        uuidv4()
      ),
      { shouldDirty: true }
    );
  };

  const handleDelete = () => {
    if (!fileUpload?.key) {
      return;
    }
    setValue(
      "documentsFinanciers",
      removeDocumentFinancierByFileKey(
        getValues("documentsFinanciers") ?? [],
        fileUpload.key
      ),
      { shouldDirty: true }
    );
  };

  return (
    <UploadItem
      titleId={titleId}
      title={
        <>
          {documentType.label}
          {hasRequirementLabel && !isRequired && (
            <>
              {" "}
              <span className="italic">(optionnel)</span>
            </>
          )}
        </>
      }
      subTitle={
        isCoveredByCpom
          ? "Déjà transmis au niveau du CPOM"
          : documentType.subLabel
      }
    >
      <FileUploadBox
        value={fileUpload}
        onUpload={handleUpload}
        onDelete={handleDelete}
        ariaLabelledBy={titleId}
        accessibleLabel={`${documentType.label} ${year}`}
        errorMessage={
          hasMissingRequiredError ? "Ce document est requis" : undefined
        }
      />
    </UploadItem>
  );
};

type Props = {
  documentType: StructureDocument;
  year: number;
  structureType?: StructureType;
  isRequired: boolean;
  hasRequirementLabel: boolean;
  isCoveredByCpom?: boolean;
  hasYearError?: boolean;
};
