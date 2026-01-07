import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import { getYearRange } from "@/app/utils/date.util";
import { getTypologieIndexForAYear } from "@/app/utils/structure.util";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { Granularity } from "@/types/document-financier";

export const BudgetTableCommentLine = ({
  label,
  budgets,
  disabledYearsStart,
  enabledYears,
  granularity,
}: Props) => {
  const modal = createModal({
    id: `${granularity}-commentaire-modal`,
    isOpenedByDefault: false,
  });

  const parentFormContext = useFormContext();

  const { register, setValue } = parentFormContext;

  const { years } = getYearRange({ order: "desc" });

  const inputModalRef = useRef<HTMLTextAreaElement>(null);

  const [currentCommentIndex, setCurrentCommentIndex] = useState<
    number | undefined
  >(undefined);

  const handleOpenModal = (year: number) => {
    const newCommentIndex = getTypologieIndexForAYear(budgets, year);
    setCurrentCommentIndex(newCommentIndex);
    if (inputModalRef.current) {
      inputModalRef.current.value = budgets[newCommentIndex]?.commentaire || "";
    }
    modal.open();
  };

  const handleCloseModal = () => {
    setCurrentCommentIndex(undefined);
    modal.close();
  };

  const handleSaveModal = () => {
    setValue(
      `budgets.${currentCommentIndex}.commentaire`,
      inputModalRef.current?.value || ""
    );
    handleCloseModal();
  };

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
              {budgets[getTypologieIndexForAYear(budgets, year)]?.commentaire
                ? "Modifier"
                : "Ajouter"}
            </Button>

            <input
              type="hidden"
              id={`gestionBudgetaire.${getTypologieIndexForAYear(budgets, year)}.commentaire`}
              {...register(
                `budgets.${getTypologieIndexForAYear(budgets, year)}.commentaire`
              )}
            />
          </td>
        ))}
      </tr>
      <modal.Component
        title={
          currentCommentIndex && budgets?.[currentCommentIndex]?.commentaire
            ? "Modifier un commentaire"
            : "Ajouter un commentaire"
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
            children:
              currentCommentIndex && budgets?.[currentCommentIndex]?.commentaire
                ? "Modifier"
                : "Ajouter",
            type: "button",
            onClick: () => {
              handleSaveModal();
            },
          },
        ]}
      >
        <p className="font-bold text-xl">
          Détail affectation réserves et provisions du CPOM — Année{" "}
          {(currentCommentIndex && budgets?.[currentCommentIndex]?.year) || ""}
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
  budgets: BudgetApiType[];
  disabledYearsStart?: number;
  enabledYears?: number[];
  granularity: Granularity.CPOM | Granularity.STRUCTURE;
}
