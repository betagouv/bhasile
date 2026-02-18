"use client";

import Notice from "@codegouvfr/react-dsfr/Notice";
import { useForm, useFormContext } from "react-hook-form";

import { Table } from "@/app/components/common/Table";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { cn } from "@/app/utils/classname.util";
import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";

export const IndicateursGeneraux = () => {
  const { years } = getYearRange();
  const parentFormContext = useFormContext();
  const localForm = useForm();
  const { control, formState, register } = parentFormContext || localForm;
  const errors = formState.errors;

  const hasBudgetErrors =
    Array.isArray(errors.budgets) &&
    errors.budgets.some(
      (budgetItemErrors: Record<string, unknown>) =>
        budgetItemErrors?.ETP ||
        budgetItemErrors?.tauxEncadrement ||
        budgetItemErrors?.coutJournalier
    );

  return (
    <fieldset className="flex flex-col gap-6">
      <legend className="text-xl font-bold mb-8 text-title-blue-france">
        Indicateurs généraux
      </legend>
      <Notice
        severity="info"
        title=""
        className="rounded [&_p]:flex [&_p]:items-center mb-8 w-fit [&_.fr-notice\_\_desc]:text-text-default-grey"
        description="Le nombre d’ETP correspond à l’ensemble des employés de la structure (ex : “8 ETP”). Le taux d’encadrement est le nombre de places gérées par un ETP, obtenu en divisant le nombre de places autorisées par le nombre d’ETP total (ex: “12 places gérées par un ETP” dans une structure de 96 places avec 8 ETP). Le coût journalier est le coût de la structure pour une journée et pour une place, défini dans les documents contractuels (ex: “23,50€ par jour par place”)."
      />
      <p className="mb-0">
        Veuillez renseigner l’historique de ces indicateurs financiers au 1er
        janvier de chaque année.
      </p>
      <Table
        hasErrors={hasBudgetErrors}
        headings={[
          <th scope="col" key="annee" className="!border-r-1">
            Année
          </th>,
          <th
            scope="col"
            key="etp"
            className="uppercase text-mention-grey py-4 px-5 text-center text-xs"
          >
            <span className="flex flex-col">
              Nombre
              <span className="text-sm">ETP</span>
            </span>
          </th>,
          <th
            scope="col"
            key="encadrement"
            className="uppercase text-mention-grey py-4 px-5 text-center text-xs !border-r-1"
          >
            <span className="flex flex-col">
              Taux
              <span className="text-sm">encadrement</span>
            </span>
          </th>,
          <th
            scope="col"
            key="cout"
            className="uppercase text-mention-grey py-4 px-5 text-center text-xs"
          >
            <span className="flex flex-col">
              Coût
              <span className="text-sm">journalier</span>
            </span>
          </th>,
        ]}
        ariaLabelledBy=""
        className={cn("scroll-margin-header w-fit [&_input]:max-w-28")}
        enableBorders
      >
        {years.map((year, index) => (
          <tr key={year} className="w-full border-t border-default-grey ">
            <td className="align-middle py-4 !border-r-1">
              {year}
              {CURRENT_YEAR - year < 2 && (
                <>
                  <br />
                  <span className="text-xs">(prévisionnel)</span>
                </>
              )}
              <input type="hidden" {...register(`budgets.${index}.id`)} />
              <input
                type="hidden"
                value={year}
                {...register(`budgets.${index}.year`)}
              />
            </td>
            <td className="!py-4">
              <InputWithValidation
                name={`budgets.${index}.ETP`}
                id={`budgets.${index}.ETP`}
                control={control}
                type="number"
                min={0}
                label=""
                className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:max-w-16"
                variant="simple"
              />
            </td>
            <td className="!py-1 !border-r-1">
              <InputWithValidation
                name={`budgets.${index}.tauxEncadrement`}
                id={`budgets.${index}.tauxEncadrement`}
                control={control}
                type="number"
                min={0}
                label=""
                className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:max-w-32"
                variant="simple"
              />
            </td>
            <td className="!py-1">
              <span className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${index}.coutJournalier`}
                  id={`budgets.${index}.coutJournalier`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:max-w-16"
                  variant="simple"
                />
                €
              </span>
            </td>
          </tr>
        ))}
      </Table>
      {hasBudgetErrors && (
        <p className="text-label-red-marianne">
          Toutes les cases doivent être remplies avec des nombres positifs
        </p>
      )}
    </fieldset>
  );
};
