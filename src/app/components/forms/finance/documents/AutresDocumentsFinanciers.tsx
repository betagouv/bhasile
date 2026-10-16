import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import {
  DocumentFinancierFlexibleFormValues,
  DocumentsFinanciersFlexibleFormValues,
} from "@/schemas/forms/base/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";
import {
  DocumentFinancierSlot,
  getDocumentFinancierRowKey,
  isDocumentFinancierInSlot,
  removeDocumentFinancierRow,
  updateDocumentFinancierRow,
} from "@/utils/document-financier-form.util";

import { AutreDocumentFinancierRow } from "./AutreDocumentFinancierRow";

export const AutresDocumentsFinanciers = ({
  year,
  structureType,
}: Props): ReactElement => {
  const { control, getValues, setValue } =
    useFormContext<DocumentsFinanciersFlexibleFormValues>();
  const documentsFinanciers =
    useWatch({ control, name: "documentsFinanciers" }) ?? [];

  const [ghostUuid] = useState(() => uuidv4());
  const addRowButtonRef = useRef<HTMLButtonElement>(null);

  const slot: DocumentFinancierSlot = {
    year,
    category: "AUTRE_FINANCIER",
    structureType,
  };
  const createRow = (uuid: string): DocumentFinancierFlexibleFormValues => ({
    uuid,
    year,
    category: "AUTRE_FINANCIER",
    structureType,
  });

  const rows = documentsFinanciers.filter((documentFinancier) =>
    isDocumentFinancierInSlot(documentFinancier, slot)
  );
  const displayedRows = rows.length > 0 ? rows : [createRow(ghostUuid)];

  const updateDocumentsFinanciers = (
    transform: (
      currentDocumentsFinanciers: DocumentFinancierFlexibleFormValues[]
    ) => DocumentFinancierFlexibleFormValues[]
  ) => {
    setValue(
      "documentsFinanciers",
      transform(getValues("documentsFinanciers") ?? []),
      { shouldDirty: true }
    );
  };

  const handleAddRow = () => {
    updateDocumentsFinanciers((currentDocumentsFinanciers) => {
      const hasRows = currentDocumentsFinanciers.some((documentFinancier) =>
        isDocumentFinancierInSlot(documentFinancier, slot)
      );
      return [
        ...currentDocumentsFinanciers,
        ...(hasRows ? [] : [createRow(ghostUuid)]),
        createRow(uuidv4()),
      ];
    });
  };

  return (
    <div className="mt-10 mb-10">
      <p className="text-title-blue-france font-bold mb-4">Autres documents</p>
      {displayedRows.map((row, index) => (
        <AutreDocumentFinancierRow
          key={getDocumentFinancierRowKey(row)}
          documentFinancier={row}
          year={year}
          canRemove={index > 0}
          onChange={(changes) =>
            updateDocumentsFinanciers((currentDocumentsFinanciers) =>
              updateDocumentFinancierRow(
                currentDocumentsFinanciers,
                row,
                changes,
                { canCreate: getDocumentFinancierRowKey(row) === ghostUuid }
              )
            )
          }
          onRemove={() => {
            updateDocumentsFinanciers((currentDocumentsFinanciers) =>
              removeDocumentFinancierRow(
                currentDocumentsFinanciers,
                getDocumentFinancierRowKey(row)
              )
            );
            addRowButtonRef.current?.focus();
          }}
        />
      ))}
      <Button
        ref={addRowButtonRef}
        type="button"
        priority="tertiary no outline"
        iconId="fr-icon-add-line"
        iconPosition="left"
        onClick={handleAddRow}
      >
        Ajouter un autre document
      </Button>
    </div>
  );
};

type Props = {
  year: number;
  structureType?: StructureType;
};
