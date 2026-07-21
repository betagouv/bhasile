import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { DropZone } from "@/app/components/forms/DropZone";
import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import {
  DocumentFinancierFlexibleFormValues,
  DocumentsFinanciersFlexibleFormValues,
} from "@/schemas/forms/base/documentFinancier.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";
import { StructureType } from "@/types/structure.type";

export const YearlyFileUpload = ({
  year,
  isAutorisee,
  control,
  structureType,
}: Props): ReactElement => {
  const { watch } = useFormContext();
  const documentsFinanciers: DocumentFinancierFlexibleFormValues[] = watch(
    "documentsFinanciers"
  );
  const { append, remove } = useFieldArray({
    control,
    name: "documentsFinanciers",
  });

  const documentTypes = isAutorisee
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;

  const [shouldDisplayCategorySelect, setShouldDisplayCategorySelect] =
    useState(false);
  const [shouldDisplayNameInput, setShouldDisplayNameInput] = useState(false);
  const [shouldDisplayAddButton, setShouldDisplayAddButton] = useState(false);
  const [shouldEnableAddButton, setShouldEnableAddButton] = useState(false);

  //  key is used to reset the drop zone when a document is added
  const [dropZoneKey, setDropZoneKey] = useState<string>(uuidv4());

  const [key, setKey] = useState<string | undefined>();
  const [category, setCategory] = useState<
    DocumentFinancierCategory | undefined
  >();
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    if (key) {
      setShouldDisplayCategorySelect(true);
      setShouldDisplayAddButton(true);
    } else {
      setShouldDisplayCategorySelect(false);
      setShouldDisplayAddButton(false);
      setCategory(undefined);
      setName(undefined);
    }
  }, [key]);

  useEffect(() => {
    setShouldDisplayNameInput(!!key && category === "AUTRE_FINANCIER");
  }, [key, category]);

  useEffect(() => {
    setShouldEnableAddButton(!!key && !!category);
  }, [key, category]);

  const handleAddDocument = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const index = documentsFinanciers.findIndex((documentFinancier) => {
        return (
          documentFinancier.year === year &&
          documentFinancier.category === category &&
          documentFinancier.structureType === structureType
        );
      });
      if (index !== -1 && category !== "AUTRE_FINANCIER") {
        remove(index);
      }

      append({
        fileUploads: key ? [{ key }] : undefined,
        category,
        structureType,
        name,
        year,
      });

      setKey(undefined);
      setCategory(undefined);
      setName(undefined);
      setDropZoneKey(uuidv4());
    },
    [append, key, category, name, year, documentsFinanciers, remove, structureType]
  );

  const handleFileChange = useCallback(
    ({ key }: { key?: string }) => {
      setKey(key);
    },
    [setKey]
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <DropZone
        onChange={handleFileChange}
        className="min-h-[24rem] max-h-[30rem]"
        key={dropZoneKey}
      >
        {shouldDisplayCategorySelect && (
          <Select
            label="Type de document"
            className="w-80"
            nativeSelectProps={{
              onChange: (e) => {
                setCategory(e.target.value as DocumentFinancierCategory);
              },
              value: category ?? "",
            }}
          >
            <option value="">Sélectionnez une option</option>
            {documentTypes.map((document) => (
              <option key={document.value} value={document.value}>
                {document.label}
              </option>
            ))}
          </Select>
        )}
        {shouldDisplayNameInput && (
          <Input
            label="Nom du document"
            className="w-80"
            nativeInputProps={{
              onChange: (e) => {
                setName(e.target.value);
              },
              value: name ?? "",
            }}
          />
        )}
        {shouldDisplayAddButton && (
          <Button
            disabled={!shouldEnableAddButton}
            priority="secondary"
            onClick={handleAddDocument}
          >
            Ajouter le document
          </Button>
        )}
      </DropZone>
      <a
        target="_blank"
        className="text-default-grey text-sm underline"
        rel="noopener noreferrer"
        href="https://stirling-pdf.framalab.org/compress-pdf?lang=fr_FR"
      >
        Mon fichier est trop lourd
      </a>
    </div>
  );
};

type Props = {
  year: number;
  isAutorisee: boolean;
  control: Control<DocumentsFinanciersFlexibleFormValues>;
  structureType?: StructureType;
};
