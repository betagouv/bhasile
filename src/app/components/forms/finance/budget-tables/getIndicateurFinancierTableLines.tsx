export const getIndicateurFinancierTableLines = () => {
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
