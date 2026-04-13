export const getIndicateurFinancierTableLines = () => {
  return [
    {
      name: "ETP",
      label: "Nombre d'ETP",
      subLabel: "Ensemble des employés de la structure",
      isCurrency: false,
    },
    {
      name: "tauxEncadrement",
      label: "Taux d'encadrement",
      subLabel: "Nombre de places gérées par un ETP",
      isCurrency: false,
    },
    {
      name: "coutJournalier",
      label: "Coût journalier",
      isCurrency: true,
    },
  ];
};
