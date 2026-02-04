import { ReactElement } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import { Table } from "@/app/components/common/Table";
import { AffectationTooltip } from "@/app/components/forms/finance/budget-tables/AffectationTooltip";
import { BudgetTableCommentLine } from "@/app/components/forms/finance/budget-tables/BudgetTableCommentLine";
import { BudgetTableLines } from "@/app/components/forms/finance/budget-tables/BudgetTableLines";
import { BudgetTableRepriseEtatTooltip } from "@/app/components/forms/finance/budget-tables/BudgetTableRepriseEtatTooltip";
import { getBudgetTableHeading } from "@/app/components/forms/finance/budget-tables/getBudgetTableHeading";
import { isNullOrUndefined } from "@/app/utils/common.util";
import { getYearRange } from "@/app/utils/date.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { AmountBadge } from "./AmountBadge";

const getLines = (isAutorisee: boolean) => {
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
          },
        ],
      },
      {
        title: "Résultat",
        lines: [
          {
            name: "resultatNetProposeParOperateur",
            label: "Résultat net proposé",
            subLabel: "par l'opérateur",
            colored: true,
          },
          {
            name: "resultatNetRetenuParAutoriteTarifaire",
            label: "Résultat net retenu",
            subLabel: "par l'autorité tarifaire",
            colored: true,
          },
          {
            name: "repriseEtat",
            label: <BudgetTableRepriseEtatTooltip />,
          },
          {
            name: "affectationReservesFondsDedies",
            label: <AffectationTooltip />,
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
        },
        {
          name: "dotationAccordee",
          label: "Dotation accordée",
        },
      ],
    },
    {
      title: "Résultat",
      lines: [
        {
          name: "resultatNet",
          label: "Résultat net",
          colored: true,
        },
        {
          name: "repriseEtat",
          label: "Déficit compensé",
          subLabel: "par l'État",
        },
        {
          name: "excedentRecupere",
          subLabel: "en titre de recette",
          label: "Excédent récupéré",
        },
        {
          name: "excedentDeduit",
          label: "Excédent réemployé",
          subLabel: "dans la dotation à venir",
        },
        {
          name: "fondsDedies",
          label: "Restant fonds dédiés",
        },
      ],
    },
  ];
};

export const StructureStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const enhancedBudgets = structure?.budgets?.map((budget) => {
    return {
      ...budget,
      resultatNet: computeResultatNet(
        budget.totalProduits,
        budget.totalCharges
      ),
      resultatNetProposeParOperateur: computeResultatNetProposeParOperateur(
        budget.totalProduits,
        budget.totalCharges
      ),
      resultatNetRetenuParAutoriteTarifaire:
        computeResultatNetRetenuParAutoriteTarifaire(
          budget.totalProduits,
          budget.totalCharges
        ),
    };
  });

  return (
    <Table
      ariaLabelledBy="gestionBudgetaire"
      headings={getBudgetTableHeading({ years, structure })}
      enableBorders
    >
      <BudgetTableLines
        lines={getLines(isAutorisee)}
        budgets={enhancedBudgets}
        canEdit={false}
      />
    </Table>
  );
};

const computeResultatNet = (
  totalCharges: number | null | undefined,
  totalProduits: number | null | undefined
): number | undefined => {
  if (isNullOrUndefined(totalCharges) || isNullOrUndefined(totalProduits)) {
    return undefined;
  }
  return Number(totalProduits) - Number(totalCharges);
};

const computeResultatNetProposeParOperateur = (
  totalProduitsProposesParOperateur: number | null | undefined,
  totalChargesProposeesParOperateur: number | null | undefined
): number | undefined => {
  if (
    isNullOrUndefined(totalProduitsProposesParOperateur) ||
    isNullOrUndefined(totalChargesProposeesParOperateur)
  ) {
    return undefined;
  }
  return (
    Number(totalProduitsProposesParOperateur) -
    Number(totalChargesProposeesParOperateur)
  );
};

const computeResultatNetRetenuParAutoriteTarifaire = (
  totalProduits: number | null | undefined,
  totalChargesRetenues: number | null | undefined
): number | undefined => {
  if (
    isNullOrUndefined(totalProduits) ||
    isNullOrUndefined(totalChargesRetenues)
  ) {
    return undefined;
  }
  return Number(totalProduits) - Number(totalChargesRetenues);
};
