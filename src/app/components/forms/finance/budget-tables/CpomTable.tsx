import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Badge } from "@/app/components/common/Badge";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureInCpom } from "@/app/utils/structure.util";
import {
  DOTATION_ACCORDEE_DISABLED_YEARS,
  DOTATION_DEMANDEE_DISABLED_YEARS_START,
  OTHER_DISABLED_YEARS_START,
  TOTAL_PRODUITS_DISABLED_YEARS_START,
} from "@/constants";
import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";
import { Granularity } from "@/types/document-financier";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";

export const CpomTable = () => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch } = parentFormContext || localForm;

  if (!structure.budgets) {
    return null;
  }

  const budgets = watch("budgets") as BudgetApiType[];
  const detailAffectationEnabledYears = budgets
    .filter((budget) => {
      const totalValue = Number(
        String(budget?.affectationReservesFondsDedies)
          .replaceAll(" ", "")
          .replace(",", ".") || 0
      );
      return totalValue > 0;
    })
    .map((budget) => budget.year);

  const cpomMillesimes = watch("cpomMillesimes") as CpomMillesimeApiType[];
  console.log("cpomMillesimes", cpomMillesimes);
  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={[
        " ",
        ...years.map((year) => (
          <th scope="col" key={year}>
            {year}{" "}
            {isStructureInCpom(structure, year) ? (
              <Badge type="info">CPOM</Badge>
            ) : (
              <Badge type="success">Hors CPOM</Badge>
            )}
          </th>
        )),
      ]}
      enableBorders
    >
      <BudgetTableTitleLine label="Budget" />
      <BudgetTableLine
        name="dotationDemandee"
        label="Dotation demandée"
        budgets={structure.budgets}
        disabledYearsStart={DOTATION_DEMANDEE_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="dotationAccordee"
        label="Dotation accordée"
        budgets={structure.budgets}
        disabledYearsStart={DOTATION_ACCORDEE_DISABLED_YEARS}
        granularity={Granularity.CPOM}
      />
      <BudgetTableTitleLine label="Résultat" />
      <BudgetTableLine
        name="totalProduitsProposes"
        label="Total produits proposés"
        subLabel="dont dotation État"
        budgets={structure.budgets}
        disabledYearsStart={TOTAL_PRODUITS_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="totalProduits"
        label="Total produits retenus"
        subLabel="dont dotation État"
        budgets={structure.budgets}
        disabledYearsStart={TOTAL_PRODUITS_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="totalChargesProposees"
        label="Total charges proposées"
        subLabel="par l'opérateur"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="totalCharges"
        label="Total charges retenu"
        subLabel="par l'autorité tarifaire"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="repriseEtat"
        label="Reprise état"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="affectationReservesFondsDedies"
        label="Affectation"
        subLabel="réserves & provision"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        granularity={Granularity.CPOM}
      />
      <BudgetTableTitleLine label="Détail affectation" />
      <BudgetTableLine
        name="reserveInvestissement"
        label="Réserve"
        subLabel="dédiée à l'investissement"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="chargesNonReconductibles"
        label="Charges"
        subLabel="non reductibles"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="reserveCompensationDeficits"
        label="Réserve de compensation "
        subLabel="des déficits"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="reserveCompensationBFR"
        label="Réserve de couverture"
        subLabel="de BFR"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="reserveCompensationAmortissements"
        label="Réserve de compensation"
        subLabel="des amortissements"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="reportANouveau"
        label="Report à nouveau"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableLine
        name="autre"
        label="Autre"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        budgets={structure.budgets}
        disabledYearsStart={OTHER_DISABLED_YEARS_START}
        enabledYears={detailAffectationEnabledYears}
        granularity={Granularity.CPOM}
      />
    </Table>
  );
};
