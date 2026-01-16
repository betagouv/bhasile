import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";

export const BudgetTableCommentButtonAndModal = ({
  year,
  disabledYearsStart,
  enabledYears,
  cpomStructures,
  budgets,
}: Props) => {
  const modal = useMemo(
    () =>
      createModal({
        id: `${budgets ? "budgets" : "cpomStructures"}-${year}-commentaire-modal`,
        isOpenedByDefault: false,
      }),
    [budgets, year]
  );

  const parentFormContext = useFormContext();

  const { setValue, watch } = parentFormContext;

  const inputModalRef = useRef<HTMLTextAreaElement>(null);

  const commentPath = useMemo(
    () => getName("commentaire", year, budgets, cpomStructures),
    [year, budgets, cpomStructures]
  );

  const currentComment = watch(commentPath);

  const handleOpenModal = (year: number) => {
    const commentPath = getName("commentaire", year, budgets, cpomStructures);
    if (inputModalRef.current) {
      inputModalRef.current.value = watch(commentPath) || "";
    }

    modal.open();
  };

  const handleCloseModal = () => {
    modal.close();
  };

  const handleSaveModal = () => {
    setValue(commentPath, inputModalRef.current?.value || "");
    handleCloseModal();
  };

  return (
    <>
      <Button
        type="button"
        iconId="fr-icon-edit-box-line"
        onClick={() => {
          handleOpenModal(year);
        }}
        priority="tertiary no outline"
        size="small"
        disabled={isInputDisabled(
          year,
          disabledYearsStart,
          enabledYears,
          cpomStructures
        )}
      >
        {currentComment ? "Modifier" : "Ajouter"}
      </Button>
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
          Détail affectation réserves et provisions du CPOM — Année {year}
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
  year: number;
  disabledYearsStart?: number;
  enabledYears?: number[];
  cpomStructures?: CpomStructureApiType[];
  budgets?: BudgetApiType[];
}
