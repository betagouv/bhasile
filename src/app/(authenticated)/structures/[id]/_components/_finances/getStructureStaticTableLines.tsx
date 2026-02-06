import { AffectationTooltip } from "@/app/components/forms/finance/budget-tables/AffectationTooltip";
import { BudgetTableRepriseEtatTooltip } from "@/app/components/forms/finance/budget-tables/BudgetTableRepriseEtatTooltip";

export const getStructureStaticTableLines = (
  isAutorisee: boolean,
  isAffectationOpen: boolean
) => {
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
