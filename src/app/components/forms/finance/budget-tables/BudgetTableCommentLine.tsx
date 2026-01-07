import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { getYearRange } from "@/app/utils/date.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

import { getName } from "./BudgetTableLine";

export const BudgetTableCommentLine = ({
  label,
  budgets,
  cpomStructures,
  disabledYearsStart,
  enabledYears,
}: Props) => {
  const modal = createModal({
    id: `${cpomStructures ? "cpom" : "structure"}-commentaire-modal`,
    isOpenedByDefault: false,
  });

  const parentFormContext = useFormContext();

  const { setValue, watch } = parentFormContext;

  const { years } = getYearRange({ order: "desc" });

  const inputModalRef = useRef<HTMLTextAreaElement>(null);

  const [currentCommentPath, setCurrentCommentPath] = useState<
    string | undefined
  >(undefined);
  const [currentCommentYear, setCurrentCommentYear] = useState<
    number | undefined
  >(undefined);

  const currentComment = currentCommentPath
    ? watch(currentCommentPath)
    : undefined;

  const handleOpenModal = (year: number) => {
    const commentPath = getName("commentaire", year, budgets, cpomStructures);
    setCurrentCommentPath(commentPath);
    setCurrentCommentYear(year);
    if (inputModalRef.current) {
      inputModalRef.current.value = watch(commentPath) || "";
    }
    modal.open();
  };

  const handleCloseModal = () => {
    setCurrentCommentPath(undefined);
    setCurrentCommentYear(undefined);
    modal.close();
  };

  const handleSaveModal = () => {
    if (currentCommentPath) {
      setValue(currentCommentPath, inputModalRef.current?.value || "");
    }
    handleCloseModal();
  };

  if (!budgets && !cpomStructures) {
    return null;
  }

  return (
    <>
      <tr>
        <td>{label}</td>
        {years.map((year) => (
          <td key={year}>
            <Button
              type="button"
              iconId="fr-icon-edit-box-line"
              onClick={() => {
                handleOpenModal(year);
              }}
              priority="tertiary no outline"
              disabled={
                enabledYears
                  ? !enabledYears.includes(year)
                  : disabledYearsStart
                    ? year >= disabledYearsStart
                    : false
              }
            >
              {currentComment ? "Modifier" : "Ajouter"}
            </Button>
          </td>
        ))}
      </tr>
      <modal.Component
        title={
          currentComment ? "Modifier un commentaire" : "Ajouter un commentaire"
        }
        size="large"
        buttons={[
          {
            doClosesModal: true,
            children: "Annuler",
            type: "button",
          },
          {
            doClosesModal: true,
            children: currentComment ? "Modifier" : "Ajouter",
            type: "button",
            onClick: () => {
              handleSaveModal();
            },
          },
        ]}
      >
        <p className="font-bold text-xl">
          Détail affectation réserves et provisions du CPOM — Année{" "}
          {currentCommentYear || ""}
        </p>

        <Input
          label=""
          textArea
          nativeTextAreaProps={{
            ref: inputModalRef,
          }}
        />
      </modal.Component>
    </>
  );
};

interface Props {
  label: string;
  budgets?: BudgetApiType[];
  cpomStructures?: CpomStructureApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
}
