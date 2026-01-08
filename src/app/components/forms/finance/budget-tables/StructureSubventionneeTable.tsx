import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { useForm, useFormContext } from "react-hook-form";

import { Table } from "@/app/components/common/Table";
import InputWithValidation from "@/app/components/forms/InputWithValidation";
import { getYearRange } from "@/app/utils/date.util";

export const StructureSubventionneeTable = () => {
  const parentFormContext = useFormContext();

  const localForm = useForm();
  const { control, formState, register } = parentFormContext || localForm;
  const errors = formState.errors;

  const { years } = getYearRange();
  const sliceYears = 2;
  const yearsToDisplay = years.slice(sliceYears);

  const hasErrors =
    Array.isArray(errors.budgets) &&
    errors.budgets.some(
      (budgetItemErrors: Record<string, unknown>) =>
        budgetItemErrors?.dotationDemandee ||
        budgetItemErrors?.dotationAccordee ||
        budgetItemErrors?.totalProduits ||
        budgetItemErrors?.totalCharges ||
        budgetItemErrors?.cumulResultatsNetsCPOM ||
        budgetItemErrors?.repriseEtat ||
        budgetItemErrors?.affectationReservesFondsDedies ||
        budgetItemErrors?.commentaire
    );

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      hasErrors={hasErrors}
      preHeadings={[
        <th scope="col" key="annee" className="!border-r-1">
          {" "}
        </th>,
        <th
          scope="col"
          colSpan={2}
          key="budgetExecutoire"
          className="!border-r-3"
        >
          Demande de subvention de la structure
        </th>,
        <th
          scope="col"
          colSpan={2}
          key="compteAdministratif"
          className="!border-r-3"
        >
          Compte rendu financier de la structure
        </th>,
        <th scope="col" key="compteAdministratifCPOM" colSpan={3}>
          Compte administratif du CPOM
        </th>,
      ]}
      headings={[
        <th scope="col" key="annee" className="!border-r-1">
          Année
        </th>,
        <th scope="col" key="dotationDemandee">
          Dotation <br /> demandée
        </th>,
        <th scope="col" key="dotationAccordee" className="!border-r-3">
          Dotation <br />
          accordée
        </th>,
        <th scope="col" key="totalProduitsDotationEtat">
          Total produits <br />
          <small>dont dotation État</small>
        </th>,
        <th scope="col" key="totalChargesRetenues" className="!border-r-3">
          Total charges <br />
          retenues
        </th>,
        <th scope="col" key="cumulResultatsNetsCPOM">
          cumul résultats <br />
          NETs du CPOM
        </th>,
        <th scope="col" key="repriseEtat">
          <Tooltip
            title={
              <>
                <span>Négatif : reprise excédent</span>
                <br />
                <span>Positif : compensation déficit</span>
              </>
            }
          >
            Reprise état{" "}
            <i className="fr-icon-information-line before:scale-50 before:origin-left" />
          </Tooltip>
        </th>,
        <th scope="col" key="affectationReservesFondsDedies">
          affectation{" "}
          <small className="block">des réserves & fonds dédiés</small>
        </th>,
      ]}
      enableBorders
    >
      {yearsToDisplay.map((year) => {
        const fieldIndex = years.indexOf(year);

        return (
          <tr key={year}>
            <td className="!border-r-1">
              {year}
              <input type="hidden" {...register(`budgets.${fieldIndex}.id`)} />
              <input
                type="hidden"
                value={year}
                {...register(`budgets.${fieldIndex}.year`)}
              />
            </td>
            <td>
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.dotationDemandee`}
                  id={`gestionBudgetaire.${fieldIndex}.dotationDemandee`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td className="!border-r-3">
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.dotationAccordee`}
                  id={`gestionBudgetaire.${fieldIndex}.dotationAccordee`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.totalProduits`}
                  id={`gestionBudgetaire.${fieldIndex}.totalProduits`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td className="!border-r-3">
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.totalCharges`}
                  id={`gestionBudgetaire.${fieldIndex}.totalCharges`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.cumulResultatsNetsCPOM`}
                  id={`gestionBudgetaire.${fieldIndex}.cumulResultatsNetsCPOM`}
                  control={control}
                  type="number"
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.repriseEtat`}
                  id={`gestionBudgetaire.${fieldIndex}.repriseEtat`}
                  control={control}
                  type="number"
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
            <td>
              <div className="flex items-center gap-2">
                <InputWithValidation
                  name={`budgets.${fieldIndex}.affectationReservesFondsDedies`}
                  id={`gestionBudgetaire.${fieldIndex}.affectationReservesFondsDedies`}
                  control={control}
                  type="number"
                  min={0}
                  label=""
                  className="mb-0 mx-auto items-center [&_p]:hidden [&_input]:w-full"
                  variant="simple"
                />
                &nbsp;€
              </div>
            </td>
          </tr>
        );
      })}
    </Table>
  );
};
