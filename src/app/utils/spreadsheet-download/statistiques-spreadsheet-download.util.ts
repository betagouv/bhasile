import { CURRENT_YEAR } from "@/constants";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";
import { DownloadOptions } from "@/types/spreadsheet-download.type";

import { computeResultatNet } from "../budget.util";
import { formatDate } from "../date.util";
import { formatPercentage } from "../number.util";

const getStructuresDownloadContent = (statistiques: StatistiqueApiRead) => ({
  sheetName: "Structures",
  data: statistiques.structures.byYear,
  headersMap: {
    year: "Année",
    totalStructures: "Structures",
    totalCpoms: "CPOM complets ou partiels",
    structuresCada: "CADA",
    structuresCph: "CPH",
    structuresHuda: "HUDA",
    structuresCaes: "CAES",
    structuresBatiCollectif: "Bâti collectif",
    structuresBatiDiffus: "Bâti diffus",
    structuresBatiMixte: "Bâti mixte",
  },
});

const getTypePlacesDownloadContent = (statistiques: StatistiqueApiRead) => ({
  sheetName: "Types de places",
  data: statistiques.places.byYear.map((placeItem) => ({
    ...placeItem,
    tauxEquipement: Number(placeItem.tauxEquipement) * 1000,
  })),
  headersMap: {
    year: "Année",
    totalPlaces: "Places autorisées",
    tauxEquipement: "Taux d'équipement (‰)",
    pmr: "Places PMR",
    lgbt: "Places LGBT",
    fvvTeh: "Places FVV/TEH",
  },
});

const financeHeadersMap = {
  year: "Année",
  totalETP: "Nombre d’ETP",
  tauxEncadrement: "Taux d’encadrement moyen",
  coutJournalier: "Coût journalier moyen",
  dotationDemandee: "Dotation demandée",
  dotationAccordee: "Dotation accordée",
  totalProduits: "Total des produits retenu, dont dotation État",
  totalCharges: "Total charges retenu par les autorités tarifaires",
  resultatNet: "Résultat net retenu par les autorités tarifaires",
};

const getFinanceScopeRows = (
  statistiques: StatistiqueApiRead,
  scope: "total" | "autorisees" | "subventionnees"
) =>
  statistiques.finance.byYear.map((financeItem) => {
    const scopeItem = financeItem[scope];
    const isEmptyResultatYear = financeItem.year >= CURRENT_YEAR;
    const totalProduits = isEmptyResultatYear ? null : scopeItem.totalProduits;
    const totalCharges = isEmptyResultatYear ? null : scopeItem.totalCharges;

    return {
      year: financeItem.year,
      ...scopeItem,
      totalProduits,
      totalCharges,
      resultatNet: computeResultatNet(totalProduits, totalCharges),
    };
  });

const getFinanceTotalDownloadContent = (statistiques: StatistiqueApiRead) => ({
  sheetName: "Finance (total)",
  data: getFinanceScopeRows(statistiques, "total"),
  headersMap: financeHeadersMap,
});

const getFinanceAutoriseeDownloadContent = (
  statistiques: StatistiqueApiRead
) => ({
  sheetName: "Finance (autorisées)",
  data: getFinanceScopeRows(statistiques, "autorisees"),
  headersMap: financeHeadersMap,
});

const getFinanceSubventionneeDownloadContent = (
  statistiques: StatistiqueApiRead
) => ({
  sheetName: "Finance (subventionnées)",
  data: getFinanceScopeRows(statistiques, "subventionnees"),
  headersMap: financeHeadersMap,
});

const getControleQualiteDownloadContent = (
  statistiques: StatistiqueApiRead
) => ({
  sheetName: "Contrôle qualité",
  data: statistiques.controleQualite.byMonth.map((controleQualiteItem) => ({
    ...controleQualiteItem,
    date: formatDate(controleQualiteItem.date),
    tauxEigComportementViolent: formatPercentage(
      Number(controleQualiteItem.tauxEigComportementViolent)
    ),
  })),
  headersMap: {
    date: "Date",
    nbStructuresSansDeclarationEig: "Structures ne déclarant aucun EIG",
    nbEig: "Tous les EIG",
    nbEigComportementViolent: "EIG “comportement violent“",
    tauxEigComportementViolent: "Taux d'EIG “comportement violent“",
    nbStructuresEvaluees: "Structures évaluées",
    noteGenerale: "Moyenne totale",
    notePersonne: "Moyenne “La personne“",
    notePro: "Moyenne “Les professionnels“",
    noteStructure: "Moyenne “La structure“",
  },
});

const getActiviteDownloadContent = (statistiques: StatistiqueApiRead) => ({
  sheetName: "Activité (OFII)",
  data: statistiques.activite.byMonth.map((activiteItem) => ({
    ...activiteItem,
    date: formatDate(activiteItem.date),
    tauxPresencesInduesBPI: formatPercentage(
      Number(activiteItem.tauxPresencesInduesBPI)
    ),
    tauxPresencesInduesDeboutees: formatPercentage(
      Number(activiteItem.tauxPresencesInduesDeboutees)
    ),
    tauxPresencesInduesTotal: formatPercentage(
      Number(activiteItem.tauxPresencesInduesTotal)
    ),
  })),
  headersMap: {
    date: "Date",
    placesEnregistreesDna: "Places enregistrées DNA",
    placesIndisponibles: "Indisponibilité",
    presencesInduesBPI: "Présences indues BPI",
    tauxPresencesInduesBPI: "Taux présences indues BPI (seuil à 3%)",
    presencesInduesDeboutees: "Présences indues déboutées",
    tauxPresencesInduesDeboutees:
      "Taux présences indues déboutées (seuil à 4%)",
    presencesInduesTotal: "Présences indues totales",
    tauxPresencesInduesTotal: "Taux présences indues totales (seuil à 7%)",
  },
});

const getRmuDownloadContent = (statistiques: StatistiqueApiRead) => ({
  sheetName: "Référés Mesures Utiles",
  data:
    statistiques.rmu?.byMonth.map((rmuItem) => ({
      ...rmuItem,
      date: formatDate(rmuItem.date),
      tauxExecute: formatPercentage(Number(rmuItem.tauxExecute)),
    })) || [],
  headersMap: {
    date: "Date",
    referesEngages: "Référés mesures utiles engagés",
    referesExecutes: "Référés mesures utiles exécutés",
    tauxExecute: "Taux de RMU exécuté",
  },
});

export const getStatistiquesDownloadContent = (
  statistiques: StatistiqueApiRead,
  areFiltersApplied: boolean = false
): DownloadOptions => {
  return {
    fileName: `Statistiques${areFiltersApplied ? " personnalisées" : ""} ${formatDate(Date.now()).replaceAll("/", "-")}`,
    sheets: [
      getStructuresDownloadContent(statistiques),
      getTypePlacesDownloadContent(statistiques),
      getFinanceTotalDownloadContent(statistiques),
      getFinanceAutoriseeDownloadContent(statistiques),
      getFinanceSubventionneeDownloadContent(statistiques),
      getControleQualiteDownloadContent(statistiques),
      getActiviteDownloadContent(statistiques),
      getRmuDownloadContent(statistiques),
    ],
  };
};
