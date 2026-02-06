import Tooltip from "@codegouvfr/react-dsfr/Tooltip";
import { useForm, useFormContext } from "react-hook-form";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { Table } from "@/app/components/common/Table";
import { getYearRange } from "@/app/utils/date.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { AUTORISEE_OPEN_YEAR, SUBVENTIONNEE_OPEN_YEAR } from "@/constants";
import { BudgetApiType } from "@/schemas/api/budget.schema";

import { BudgetTableCommentLine } from "./BudgetTableCommentLine";
import { BudgetTableLines } from "./BudgetTableLines";
import { BudgetTableRepriseEtatTooltip } from "./BudgetTableRepriseEtatTooltip";
import { getBudgetTableHeading } from "./getBudgetTableHeading";

export const StructureTable = ({ canEdit = true }: Props) => {
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

  const budgets = canEdit
    ? (watch("budgets") as BudgetApiType[])
    : structure?.budgets;

  if (!budgets || budgets.length === 0) {
    return null;
  }

  const detailAffectationEnabledYears = budgets
    .filter((budget) => {
      const totalValue = Number(
        String(budget?.affectationReservesFondsDedies)
          .replaceAll(" ", "")
          .replace(",", ".") || 0
      );
      return totalValue !== 0 && !isNaN(totalValue);
    })
    .map((budget) => budget.year);

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      hasErrors={hasErrors}
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
    >
      <BudgetTableLines
        lines={getLines(isAutorisee, detailAffectationEnabledYears)}
        budgets={budgets}
        canEdit={canEdit}
      />
      <BudgetTableCommentLine
        label="Commentaire"
        budgets={budgets}
        disabledYearsStart={
          isSubventionnee ? SUBVENTIONNEE_OPEN_YEAR + 1 : undefined
        }
        enabledYears={years}
        canEdit={canEdit}
      />
    </Table>
  );
};

type Props = {
  canEdit?: boolean;
};

const getLines = (
  isAutorisee: boolean,
  detailAffectationEnabledYears: number[]
) => {
  if (isAutorisee) {
    return [
      {
        title: "Budget",
        lines: [
          {
            name: "dotationDemandee",
            label: "Dotation demandée",
          },
          {
            name: "dotationAccordee",
            label: "Dotation accordée",
            disabledYearsStart: AUTORISEE_OPEN_YEAR + 1,
          },
        ],
      },
      {
        title: "Résultat",
        lines: [
          {
            name: "totalProduitsProposes",
            label: "Total produits proposé",
            subLabel: "dont dotation État",
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
          {
            name: "totalProduits",
            label: "Total produits retenus",
            subLabel: "dont dotation État",
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
          {
            name: "totalChargesProposees",
            label: "Total charges proposé",
            subLabel: "par l'opérateur",
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
          {
            name: "totalCharges",
            label: "Total charges retenu",
            subLabel: "par l'autorité tarifaire",
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
          {
            name: "repriseEtat",
            label: <BudgetTableRepriseEtatTooltip />,
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
          {
            name: "affectationReservesFondsDedies",
            label: (
              <Tooltip
                title={
                  <>
                    <span>Négatif : affectation d’un déficit</span>
                    <br />
                    <span>Positif : affectation d’un excédent</span>
                  </>
                }
              >
                Affectation{" "}
                <i className="fr-icon-information-line before:scale-50 before:origin-left" />
              </Tooltip>
            ),
            subLabel: "réserves & provision",
            disabledYearsStart: AUTORISEE_OPEN_YEAR,
          },
        ],
      },
      {
        title: "Détail affectation",
        lines: [
          {
            name: "reserveInvestissement",
            label: "Réserve",
            subLabel: "dédiée à l'investissement",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "chargesNonReconductibles",
            label: "Charges",
            subLabel: "non reductibles",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "reserveCompensationDeficits",
            label: "Réserve de compensation",
            subLabel: "des déficits",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "reserveCompensationBFR",
            label: "Réserve de couverture",
            subLabel: "de BFR",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "reserveCompensationAmortissements",
            label: "Réserve de compensation",
            subLabel: "des amortissements",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "reportANouveau",
            label: "Report à nouveau",
            enabledYears: detailAffectationEnabledYears,
          },
          {
            name: "autre",
            label: "Autre",
            enabledYears: detailAffectationEnabledYears,
          },
        ],
      },
    ];
  }

  return [
    {
      title: "Budget",
      lines: [
        {
          name: "dotationDemandee",
          label: "Dotation demandée",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "dotationAccordee",
          label: "Dotation accordée",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
      ],
    },
    {
      title: "Résultat",
      lines: [
        {
          name: "totalProduits",
          label: "Total produits",
          subLabel: "dont dotation État",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "totalCharges",
          label: "Total charges retenu",
          subLabel: "par l'autorité tarifaire",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "repriseEtat",
          label: "Déficit compensé",
          subLabel: "par l'État",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "excedentRecupere",
          label: "Excédent récupéré",
          subLabel: "en titre de recette",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "excedentDeduit",
          label: "Excédent réemployé",
          subLabel: "dans la dotation à venir",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
        {
          name: "fondsDedies",
          label: "Restant fonds dédiés",
          subLabel: "",
          disabledYearsStart: SUBVENTIONNEE_OPEN_YEAR + 1,
        },
      ],
    },
  ];
};
