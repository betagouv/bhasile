import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Badge } from "@/app/components/common/Badge";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureInCpom,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { BudgetApiType } from "@/schemas/api/budget.schema";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLine } from "./BudgetTableLine";
import { BudgetTableTitleLine } from "./BudgetTableTitleLine";

export const StructureTable = () => {
  const parentFormContext = useFormContext();

  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);
  const isSubventionnee = isStructureSubventionnee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const localForm = useForm();
  const { watch, formState } = parentFormContext || localForm;

  const errors = formState.errors;
  const hasErrors =
    Array.isArray(errors.budgets) &&
    errors.budgets.some(
      (budgetItemErrors: Record<string, unknown>) =>
        budgetItemErrors?.dotationDemandee ||
        budgetItemErrors?.dotationAccordee ||
        budgetItemErrors?.totalProduits ||
        budgetItemErrors?.totalProduitsProposes ||
        budgetItemErrors?.totalCharges ||
        budgetItemErrors?.totalChargesProposees ||
        budgetItemErrors?.repriseEtat ||
        budgetItemErrors?.affectationReservesFondsDedies ||
        budgetItemErrors?.commentaire
    );

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

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      hasErrors={hasErrors}
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
        disabledYearsStart={isAutorisee ? 0 : SUBVENTIONNEE_OPEN_YEAR}
      />
      <BudgetTableLine
        name="dotationAccordee"
        label="Dotation accordée"
        budgets={structure.budgets}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR : SUBVENTIONNEE_OPEN_YEAR
        }
      />
      <BudgetTableTitleLine label="Résultat" />
      {isAutorisee && (
        <BudgetTableLine
          name="totalProduitsProposes"
          label="Total produits proposés"
          subLabel="dont dotation État"
          budgets={structure.budgets}
          disabledYearsStart={
            isAutorisee ? AUTORISEE_OPEN_YEAR - 1 : SUBVENTIONNEE_OPEN_YEAR
          }
        />
      )}
      <BudgetTableLine
        name="totalProduits"
        label="Total produits retenus"
        subLabel="dont dotation État"
        budgets={structure.budgets}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR - 1 : SUBVENTIONNEE_OPEN_YEAR
        }
      />
      {isAutorisee && (
        <BudgetTableLine
        name="totalChargesProposees"
        label="Total charges proposées"
        subLabel="par l'opérateur"
        budgets={structure.budgets}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR - 1 : SUBVENTIONNEE_OPEN_YEAR
        }
      />
      )}
      <BudgetTableLine
        name="totalCharges"
        label="Total charges retenu"
        subLabel="par l'autorité tarifaire"
        budgets={structure.budgets}
        disabledYearsStart={
          isAutorisee ? AUTORISEE_OPEN_YEAR - 1 : SUBVENTIONNEE_OPEN_YEAR
        }
      />
      {isSubventionnee && (
        <>
          <BudgetTableLine
            name="repriseEtat"
            label="Déficit compensé"
            subLabel="par l'État"
            budgets={structure.budgets}
            disabledYearsStart={SUBVENTIONNEE_OPEN_YEAR}
          />
          <BudgetTableLine
            name="excedentRecupere"
            label="Excédent récupéré"
            subLabel="en titre de recette"
            budgets={structure.budgets}
            disabledYearsStart={SUBVENTIONNEE_OPEN_YEAR}
          />
          <BudgetTableLine
            name="excedentDeduit"
            label="Excédent réemployé"
            subLabel="À réemployer dans dotation à venir"
            budgets={structure.budgets}
            disabledYearsStart={SUBVENTIONNEE_OPEN_YEAR}
          />
          <BudgetTableLine
            name="fondsDedies"
            label="Restant fonds dédiés"
            subLabel=""
            budgets={structure.budgets}
            disabledYearsStart={SUBVENTIONNEE_OPEN_YEAR}
          />
        </>
      )}
      {isAutorisee && (
        <>
          <BudgetTableLine
            name="repriseEtat"
            label={
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
            }
            budgets={structure.budgets}
            disabledYearsStart={AUTORISEE_OPEN_YEAR - 1}
          />
          <BudgetTableLine
            name="affectationReservesFondsDedies"
            label="Affectation"
            subLabel="réserves & provision"
            budgets={structure.budgets}
            disabledYearsStart={AUTORISEE_OPEN_YEAR - 1}
          />
          <BudgetTableTitleLine label="Détail affectation" />
          <BudgetTableLine
            name="reserveInvestissement"
            label="Réserve"
            subLabel="dédiée à l'investissement"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="chargesNonReconductibles"
            label="Charges"
            subLabel="non reductibles"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="reserveCompensationDeficits"
            label="Réserve de compensation "
            subLabel="des déficits"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="reserveCompensationBFR"
            label="Réserve de couverture"
            subLabel="de BFR"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="reserveCompensationAmortissements"
            label="Réserve de compensation"
            subLabel="des amortissements"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="reportANouveau"
            label="Report à nouveau"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
          <BudgetTableLine
            name="autre"
            label="Autre"
            budgets={structure.budgets}
            enabledYears={detailAffectationEnabledYears}
          />
        </>
      )}
      <BudgetTableCommentLine
        label="Commentaire"
        budgets={structure.budgets}
        disabledYearsStart={
          isSubventionnee ? SUBVENTIONNEE_OPEN_YEAR : undefined
        }
        enabledYears={isAutorisee ? detailAffectationEnabledYears : undefined}
      />
    </Table>
  );
};
