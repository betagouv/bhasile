import { Button } from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";

import { getName, isInputDisabled } from "@/app/utils/budget.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import {
  CpomMillesimeApiType,
  CpomStructureApiType,
} from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

export const BudgetTableCommentButtonAndModal = ({
  type,
  year,
  disabledYearsStart,
  enabledYears,
  cpomStructures,
  cpomMillesimes,
  budgets,
}: Props) => {
  const modal = useMemo(
    () =>
      createModal({
        id: `${budgets ? "budgets" : "cpomStructures"}-${year}-${type}-commentaire-modal`,
        isOpenedByDefault: false,
      }),
    [budgets, year, type]
  );

  const parentFormContext = useFormContext();

  const { setValue, watch } = parentFormContext;

  const inputModalRef = useRef<HTMLTextAreaElement>(null);

  const isAboutCpom = useMemo(() => {
    return cpomStructures || cpomMillesimes;
  }, [cpomStructures, cpomMillesimes]);

  const commentPath = useMemo(
    () =>
      getName(
        "commentaire",
        year,
        type,
        budgets,
        cpomStructures,
        cpomMillesimes
      ),
    [year, type, budgets, cpomStructures, cpomMillesimes]
  );

  const currentComment = watch(commentPath);

  const handleOpenModal = (year: number) => {
    const commentPath = getName(
      "commentaire",
      year,
      type,
      budgets,
      cpomStructures,
      cpomMillesimes
    );
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
        iconId="fr-icon-eye-line"
        onClick={() => {
          handleOpenModal(year);
        }}
        priority="tertiary no outline"
        size="small"
        disabled={isInputDisabled(
          year,
          type,
          disabledYearsStart,
          enabledYears,
          cpomStructures
        )}
        className="font-bold"
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
        className="[&_h1]:text-left! [&_p]:text-left!"
      >
        <p className="font-bold text-xl">
          Détail affectation réserves et provisions{" "}
          {isAboutCpom ? "du CPOM" : "de la structure"} — {year}
        </p>

        <Input
          label=""
          textArea
          nativeTextAreaProps={{
            ref: inputModalRef,
            rows: 10,
          }}
        />
      </modal.Component>
    </>
  );
};

type Props = {
  type?: StructureType;
  year: number;
  disabledYearsStart?: number;
  enabledYears?: number[];
  cpomStructures?: CpomStructureApiType[];
  cpomMillesimes?: CpomMillesimeApiType[];
  budgets?: BudgetApiType[];
};
