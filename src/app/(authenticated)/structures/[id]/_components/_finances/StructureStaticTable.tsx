"use client";

import { ReactElement, useState } from "react";

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
import { ButtonAffectations } from "../ButtonAffectations";

export const StructureStaticTable = (): ReactElement => {
  const { structure } = useStructureContext();

  const isAutorisee = isStructureAutorisee(structure?.type);

  const { years } = getYearRange({ order: "desc" });

  const [isAffectationOpen, setIsAffectationOpen] = useState(false);

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
    <>
      <p>
        Dans cette vue, l’ensemble des montants correspondent à la gestion
        budgétaire <strong>à l’échelle de la structure</strong>,<br />
        que celle-ci fasse partie d’un CPOM ou non.
      </p>
      <Table
        ariaLabelledBy="gestionBudgetaire"
        headings={getBudgetTableHeading({ years, structure })}
        enableBorders
      >
        <BudgetTableLines
          lines={getLines(isAutorisee, isAffectationOpen)}
          budgets={enhancedBudgets}
          canEdit={false}
        />
        {isAffectationOpen && (
          <BudgetTableCommentLine
            label="Commentaire"
            budgets={enhancedBudgets}
            enabledYears={years}
            canEdit={false}
          />
        )}
      </Table>
      <ButtonAffectations
        isAffectationOpen={isAffectationOpen}
        setIsAffectationOpen={setIsAffectationOpen}
      />
    </>
  );
};

const getLines = (isAutorisee: boolean, isAffectationOpen: boolean) => {
  if (isAutorisee) {
    const linesWithoutAffectation = [
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
    if (isAffectationOpen) {
      return [
        ...linesWithoutAffectation,
        {
          title: "Détail affectation",
          lines: [
            {
              name: "reserveInvestissement",
              label: "Réserve",
              subLabel: "dédiée à l'investissement",
            },
            {
              name: "chargesNonReconductibles",
              label: "Charges",
              subLabel: "non reconductibles",
            },
            {
              name: "reserveCompensationDeficits",
              label: "Réserve de compensation",
              subLabel: "des déficits",
            },
            {
              name: "reserveCompensationBFR",
              label: "Réserve de couverture",
              subLabel: "de BFR",
            },
            {
              name: "reserveCompensationAmortissements",
              label: "Réserve de compensation",
              subLabel: "des amortissements",
            },
            {
              name: "reportANouveau",
              label: "Report à nouveau",
            },
            {
              name: "autre",
              label: "Autre",
            },
          ],
        },
      ];
    }
    return linesWithoutAffectation;
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

const computeResultatNet = (
  totalProduits: number | null | undefined,
  totalCharges: number | null | undefined
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
