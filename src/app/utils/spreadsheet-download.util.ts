"use client";

import { StructureApiRead } from "@/schemas/api/structure.schema";
import {
  CombinedFinancialData,
  DownloadOptions,
  SheetOption,
} from "@/types/spreadsheet-download.type";

import { computeResultatNet } from "./budget.util";
import { formatDate, getTypePlacesYearRange, getYearRange } from "./date.util";

export const downloadDocument = async <TRecord extends Record<string, unknown>>(
  options: DownloadOptions<TRecord>
): Promise<void> => {
  const { fileName } = options;

  let sheetsToProcess: SheetOption<Record<string, unknown>>[] = [];

  if (options.sheets) {
    sheetsToProcess = options.sheets;
  } else if (options.data && options.headersMap && options.sheetName) {
    sheetsToProcess = [
      {
        sheetName: options.sheetName,
        data: options.data,
        headersMap: options.headersMap,
        emptyMessage: options.emptyMessage,
      },
    ];
  }

  if (sheetsToProcess.length === 0) {
    console.warn("Aucune donnée ni feuille à exporter.");
    return;
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheetOption of sheetsToProcess) {
    const { sheetName, data, headersMap, emptyMessage } = sheetOption;
    const targetKeys = Object.keys(headersMap);

    let worksheet: import("xlsx").WorkSheet;

    if (!data || data.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([[emptyMessage || "Pas de données"]]);
    } else {
      const filteredData = data.map((row) => {
        const newRow: Record<string, unknown> = {};
        targetKeys.forEach((key) => {
          newRow[key] = row[key] ?? null;
        });
        return newRow;
      });

      const headerTitles = targetKeys.map((key) => headersMap[key]);

      worksheet = XLSX.utils.json_to_sheet(filteredData, {
        header: targetKeys,
      });

      XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const cleanFileName = fileName.endsWith(".ods")
    ? fileName
    : `${fileName}.ods`;

  XLSX.writeFile(workbook, cleanFileName, { bookType: "ods" });
};

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
  const years = getYearRange().years;

  const indicateursFinanciers = (structure.indicateursFinanciers || []).filter(
    (indicateur) => years.includes(indicateur.year)
  );

  const budgets = (structure.budgets || [])
    .filter((budget) => years.includes(budget.year))
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
      resultatNet: "Résultat net proposé par l'opérateur",
      resultatNetProposeParOperateur:
        "Résultat net proposé par l'autorité tarifaire",
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
    fileName: `structure-${structure.codeBhasile}`,
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
