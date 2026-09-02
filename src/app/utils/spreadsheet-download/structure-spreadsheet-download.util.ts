import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import {
  CombinedFinancialData,
  DownloadOptions,
} from "@/types/spreadsheet-download.type";

import { computeResultatNet } from "../budget.util";
import { formatDate, getTypePlacesYearRange, getYearRange } from "../date.util";
import { isYearRealisee } from "../indicateurFinancier.util";
import { getRealCreationYear } from "../structure.util";

export const getTypePlacesDownloadContent = (structure: StructureApiRead) => ({
  fileName: `type-places-${structure.codeBhasile}`,
  sheetName: "Type de places",
  data: structure.structureTypologies
    .map((structureTypologie) => ({
      ...structureTypologie,
      placesAutorisees: structureTypologie.placesAutorisees!,
    }))
    .filter((structureTypologie) =>
      getTypePlacesYearRange().years.includes(structureTypologie.year)
    ),
  headersMap: {
    year: "Année",
    placesAutorisees: "Places autorisées",
    pmr: "Places PMR",
    lgbt: "Places LGBT",
    fvvTeh: "Places FVV/TEH",
  },
});

export const getFinancesDownloadContent = (structure: StructureApiRead) => {
  const { years } = getYearRange();
  const startYear = getRealCreationYear(structure);
  const yearsToDisplay = years.filter((year) => year >= startYear);

  const rawIndicateurs = structure.indicateursFinanciers || [];

  // TODO : ajouter une colonne Prévisionnel et une colonne Réalisé pour chaque indicateur financier

  const indicateursFinanciers = yearsToDisplay
    .map((year) => {
      const targetType = isYearRealisee(rawIndicateurs, year)
        ? "REALISE"
        : "PREVISIONNEL";

      return rawIndicateurs.find(
        (indicateur) =>
          indicateur.year === year && indicateur.type === targetType
      );
    })
    .filter(
      (indicateur): indicateur is IndicateurFinancierApiType =>
        indicateur !== undefined
    );

  const budgets = (structure.budgets || [])
    .filter((budget) => yearsToDisplay.includes(budget.year))
    .map((budget) => ({
      ...budget,
      resultatNet: computeResultatNet(
        budget.totalProduits,
        budget.totalCharges
      ),
      resultatNetProposeParOperateur: computeResultatNet(
        budget.totalProduitsProposes,
        budget.totalChargesProposees
      ),
    }));

  const mergedByYear = new Map<number, CombinedFinancialData>();

  for (const indicateurFinancier of indicateursFinanciers) {
    mergedByYear.set(indicateurFinancier.year, {
      ...mergedByYear.get(indicateurFinancier.year),
      ...indicateurFinancier,
    });
  }

  for (const budget of budgets) {
    mergedByYear.set(budget.year, {
      ...mergedByYear.get(budget.year),
      ...budget,
    });
  }

  const data: CombinedFinancialData[] = Array.from(mergedByYear.values());

  return {
    fileName: `finances-${structure.codeBhasile}`,
    sheetName: "Finances",
    data,
    headersMap: {
      year: "Année",
      ETP: "ETP",
      tauxEncadrement: "Taux d'encadrement",
      coutJournalier: "Coût journalier",
      dotationDemandee: "Dotation demandée",
      dotationAccordee: "Dotation accordée",
      resultatNet: "Résultat net proposé par l'autorité tarifaire",
      resultatNetProposeParOperateur: "Résultat net proposé par l'opérateur",
      repriseEtat: "Reprise Etat",
      affectationReservesFondsDedies: "Affectation",
      reserveInvestissement: "Réserve dédiée à l'investissement",
      chargesNonReconductibles: "Charges non reconductibles",
      reserveCompensationDeficits: "Réserve de compensation des déficits",
      reserveCompensationBFR: "Réserve de couverture de BFR",
      reserveCompensationAmortissements:
        "Réserve de compensation des amortissements",
      reportANouveau: "Report à nouveau",
      autre: "Autre",
      commentaire: "Commentaire",
    },
  };
};

export const getControleQualiteDownloadContent = (
  structure: StructureApiRead
): DownloadOptions => {
  return {
    fileName: `controle-qualite-${structure.codeBhasile}`,
    sheets: [
      {
        sheetName: "Evenements Indésirables Graves",
        data:
          structure.evenementsIndesirablesGraves?.map(
            (evenementIndesirableGrave) => ({
              ...evenementIndesirableGrave,
              evenementDate: formatDate(
                evenementIndesirableGrave.evenementDate
              ),
              declarationDate: formatDate(
                evenementIndesirableGrave.declarationDate
              ),
            })
          ) || [],
        headersMap: {
          numeroDossier: "Numéro de dossier",
          evenementDate: "Date de l'événement",
          declarationDate: "Date de la déclaration",
          type: "Nature des faits",
        },
        emptyMessage: "Pas de données pour les EIG",
      },
      {
        sheetName: "Evaluations",
        data:
          structure.evaluations?.map((evaluation) => ({
            ...evaluation,
            date: formatDate(evaluation.date),
          })) || [],
        headersMap: {
          date: "Date",
          notePersonne: "Note de la personne",
          notePro: "Note des professionnels",
          noteStructure: "Note de la structure",
          note: "Moyenne",
        },
        emptyMessage: "Pas de données pour les évaluations",
      },
      {
        sheetName: "Inspections-contrôles",
        data:
          structure.controles?.map((controle) => ({
            ...controle,
            date: formatDate(controle.date),
          })) || [],
        headersMap: {
          date: "Date du contrôle",
          type: "Type du contrôle",
        },
        emptyMessage: "Pas de données pour les contrôles",
      },
    ],
  };
};

export const getStructureDownloadContent = (
  structure: StructureApiRead
): DownloadOptions => {
  const typePlaces = getTypePlacesDownloadContent(structure);
  const finances = getFinancesDownloadContent(structure);
  const controleQualite = getControleQualiteDownloadContent(structure);

  return {
    fileName: `Structure ${structure.codeBhasile} ${formatDate(new Date()).replaceAll("_", "-")}`,
    sheets: [
      {
        sheetName: typePlaces.sheetName,
        data: typePlaces.data,
        headersMap: typePlaces.headersMap,
      },
      {
        sheetName: finances.sheetName,
        data: finances.data,
        headersMap: finances.headersMap,
      },
      ...(controleQualite.sheets || []),
    ],
  };
};
