import Button from "@codegouvfr/react-dsfr/Button";
import { RadioButtons } from "@codegouvfr/react-dsfr/RadioButtons";
import { useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import { CustomNotice } from "@/app/components/common/CustomNotice";
import { useActeAdministratifRadios } from "@/app/hooks/useActeAdministratifRadios";
import {
  AdditionalFieldsType,
  AvenantAlternative,
} from "@/config/acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

import { ActeAdministratif } from "./ActeAdministratif";

export default function FieldSetActeAdministratif({
  category,
  categoryShortName,
  title,
  notice,
  isOptional,
  canAddFile,
  canAddAvenant = false,
  avenantCanExtendDateEnd = false,
  addFileButtonLabel,
  additionalFieldsType,
  documentLabel,
  alternativeCategories,
  avenantAlternative,
  structureScope,
}: FieldSetActeAdministratifProps) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: "actesAdministratifs",
  });

  const actesAdministratifs: ActeAdministratifFormValues[] =
    watch("actesAdministratifs") || [];

  const {
    actesOfCategory,
    legend,
    categoryRadio,
    avenantRadio,
    getAdditionalFieldsType,
  } = useActeAdministratifRadios({
    category,
    title,
    additionalFieldsType,
    alternativeCategories,
    avenantAlternative,
    structureScope,
  });

  const pendingScrollUuid = useRef<string | null>(null);

  const scrollToNewRow = (node: HTMLDivElement) => {
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node
      .querySelector<HTMLInputElement>('input:not([type="hidden"])')
      ?.focus({ preventScroll: true });
  };

  const handleAddNewField = () => {
    const uuid = uuidv4();
    pendingScrollUuid.current = uuid;
    append({
      uuid,
      category,
      ...(structureScope !== undefined
        ? { structureType: structureScope }
        : {}),
    });
  };

  const handleDeleteField = (index: number, shouldConfirm = true) => {
    if (shouldConfirm) {
      const confirm = window.confirm(
        "Attention, vous allez supprimer définitivement cet acte administratif. Êtes-vous bien sûr·e de vouloir continuer ?"
      );
      if (!confirm) {
        return;
      }
    }

    const parent = actesAdministratifs[index];
    const avenantIndices = actesAdministratifs
      .map((field, fieldIndex) => ({ field, fieldIndex }))
      .filter(
        ({ field }) =>
          (field.parentId && field.parentId === parent?.id) ||
          (field.parentUuid && field.parentUuid === parent?.uuid)
      )
      .map(({ fieldIndex }) => fieldIndex);

    const indicesToRemove = [...avenantIndices, index];

    indicesToRemove.sort((a, b) => b - a);

    indicesToRemove.forEach((indexToRemove) => {
      remove(indexToRemove);
    });
  };

  return (
    <fieldset className="flex flex-col gap-6 w-full">
      <legend className="flex items-center gap-4 text-xl font-bold mb-4 text-title-blue-france">
        {legend} {isOptional && "(optionnel)"}
        {canAddFile && (
          <Button
            type="button"
            priority="secondary"
            size="small"
            iconId="fr-icon-add-line"
            onClick={handleAddNewField}
            aria-label={addFileButtonLabel ?? "Ajouter un fichier"}
          >
            Ajouter
          </Button>
        )}
      </legend>

      {typeof notice === "string" ? (
        <CustomNotice
          severity="info"
          className="rounded [&_p]:flex [&_p]:items-center w-fit"
          description={<>{notice}</>}
        />
      ) : (
        notice
      )}
      {categoryRadio && (
        <RadioButtons
          orientation="horizontal"
          name={categoryRadio.name}
          options={categoryRadio.options}
        />
      )}
      {avenantRadio && (
        <RadioButtons
          orientation="horizontal"
          name={avenantRadio.name}
          options={avenantRadio.options}
        />
      )}
      {actesOfCategory.length > 0 &&
        actesOfCategory.map((acte) => (
          <div
            key={acte.id || acte.uuid}
            className="mb-4"
            ref={(node) => {
              if (
                node &&
                acte.uuid &&
                acte.uuid === pendingScrollUuid.current
              ) {
                scrollToNewRow(node);
                pendingScrollUuid.current = null;
              }
            }}
          >
            <ActeAdministratif
              categoryShortName={categoryShortName}
              acte={acte}
              additionalFieldsType={getAdditionalFieldsType(acte)}
              documentLabel={documentLabel}
              handleDeleteField={handleDeleteField}
              canAddAvenant={canAddAvenant}
              avenantCanExtendDateEnd={avenantCanExtendDateEnd}
            />
          </div>
        ))}
    </fieldset>
  );
}

type FieldSetActeAdministratifProps = {
  category: ActeAdministratifCategory;
  categoryShortName: string;
  title: string;
  notice?: string | React.ReactElement;
  isOptional?: boolean;
  canAddFile?: boolean;
  canAddAvenant?: boolean;
  avenantCanExtendDateEnd?: boolean;
  addFileButtonLabel?: string;
  additionalFieldsType?: AdditionalFieldsType;
  documentLabel: string;
  alternativeCategories?: ActeAdministratifCategory[];
  avenantAlternative?: AvenantAlternative;
  structureScope?: StructureType | null;
};
