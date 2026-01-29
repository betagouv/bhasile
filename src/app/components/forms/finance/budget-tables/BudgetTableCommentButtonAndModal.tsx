import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
<<<<<<< HEAD
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
=======
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
>>>>>>> origin/migration

export const BudgetTableCommentButtonAndModal = ({
  year,
  disabledYearsStart,
  enabledYears,
  cpomStructures,
<<<<<<< HEAD
  cpomMillesimes,
=======
>>>>>>> origin/migration
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
<<<<<<< HEAD
    () => getName("commentaire", year, budgets, cpomStructures, cpomMillesimes),
    [year, budgets, cpomStructures, cpomMillesimes]
=======
    () => getName("commentaire", year, budgets, cpomStructures),
    [year, budgets, cpomStructures]
>>>>>>> origin/migration
  );

  const currentComment = watch(commentPath);

  const handleOpenModal = (year: number) => {
<<<<<<< HEAD
    const commentPath = getName(
      "commentaire",
      year,
      budgets,
      cpomStructures,
      cpomMillesimes
    );
=======
    const commentPath = getName("commentaire", year, budgets, cpomStructures);
>>>>>>> origin/migration
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

type Props = {
  year: number;
  disabledYearsStart?: number;
  enabledYears?: number[];
  cpomStructures?: CpomStructureApiType[];
<<<<<<< HEAD
  cpomMillesimes?: CpomMillesimeApiType[];
=======
>>>>>>> origin/migration
  budgets?: BudgetApiType[];
};
