import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { Control, useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { DropZone } from "@/app/components/forms/DropZone";
import {
  granularities,
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import {
  DocumentFinancierFlexibleFormValues,
  DocumentsFinanciersFlexibleFormValues,
} from "@/schemas/forms/base/documentFinancier.schema";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";

export const YearlyFileUpload = ({
  year,
  index,
  isAutorisee,
  control,
}: Props): ReactElement => {
  const { watch } = useFormContext();
  const documentsFinanciers: DocumentFinancierFlexibleFormValues[] = watch(
    "documentsFinanciers"
  );
  const { append, remove } = useFieldArray({
    control,
    name: "documentsFinanciers",
  });

  const isInCpom = watch(`structureMillesimes.${index}.cpom`);

  const documentTypes = isAutorisee
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;

  const [shouldDisplayCategorySelect, setShouldDisplayCategorySelect] =
    useState(false);
  const [shouldDisplayGranularitySelect, setShouldDisplayGranularitySelect] =
    useState(false);
  const [shouldDisplayCategoryNameInput, setShouldDisplayCategoryNameInput] =
    useState(false);
  const [shouldDisplayAddButton, setShouldDisplayAddButton] = useState(false);
  const [shouldEnableAddButton, setShouldEnableAddButton] = useState(false);

  //  key is used to reset the drop zone when a document is added
  const [dropZoneKey, setDropZoneKey] = useState<string>(uuidv4());

  const [key, setKey] = useState<string | undefined>();
  const [category, setCategory] = useState<
    DocumentFinancierCategory | undefined
  >();
  const [granularity, setGranularity] = useState<
    DocumentFinancierGranularity | undefined
  >(isInCpom ? undefined : "STRUCTURE");

  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    if (key) {
      setShouldDisplayCategorySelect(true);
      setShouldDisplayAddButton(true);
    } else {
      setShouldDisplayCategorySelect(false);
      setShouldDisplayGranularitySelect(false);
      setShouldDisplayAddButton(false);
      setCategory(undefined);
      setGranularity(isInCpom ? undefined : "STRUCTURE");
      setName(undefined);
    }
  }, [key, isInCpom]);

  useEffect(() => {
    if (key) {
      if (category === "AUTRE_FINANCIER") {
        setShouldDisplayCategoryNameInput(true);
      } else {
        setShouldDisplayCategoryNameInput(false);
      }
      if (category && category !== "AUTRE_FINANCIER") {
        setShouldDisplayGranularitySelect(true);
      } else {
        setShouldDisplayGranularitySelect(false);
      }
    } else {
      setShouldDisplayCategoryNameInput(false);
    }
  }, [key, category]);

  useEffect(() => {
    if (key && category) {
      if (category === "AUTRE_FINANCIER") {
        setShouldEnableAddButton(true);
      } else {
        if (granularity) {
          setShouldEnableAddButton(true);
        } else {
          setShouldEnableAddButton(false);
        }
      }
    } else {
      setShouldEnableAddButton(false);
    }
  }, [key, category, granularity, name]);

  const handleAddDocument = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

      const index = documentsFinanciers.findIndex((documentFinancier) => {
        return (
          documentFinancier.year === year &&
          documentFinancier.category === category &&
          documentFinancier.granularity === granularity
        );
      });
      if (index !== -1 && category !== "AUTRE_FINANCIER") {
        remove(index);
      }

      append({
        fileUploads: key ? [{ key }] : undefined,
        category,
        granularity,
        name,
        year,
      });

      setKey(undefined);
      setCategory(undefined);
      setGranularity(undefined);
      setName(undefined);
      setDropZoneKey(uuidv4());
    },
    [
      append,
      key,
      category,
      granularity,
      name,
      year,
      documentsFinanciers,
      remove,
    ]
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
        {shouldDisplayGranularitySelect && isInCpom && (
          <Select
            label="Échelle"
            className="w-80"
            nativeSelectProps={{
              onChange: (e) => {
                setGranularity(e.target.value as DocumentFinancierGranularity);
              },
              value: granularity ?? "",
            }}
          >
            <option value="">Sélectionnez une option</option>
            {granularities.map((granularity) => (
              <option key={granularity.value} value={granularity.value}>
                {granularity.label}
              </option>
            ))}
          </Select>
        )}
        {shouldDisplayCategoryNameInput && (
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
  index: number;
  isAutorisee: boolean;
  control: Control<DocumentsFinanciersFlexibleFormValues>;
};
