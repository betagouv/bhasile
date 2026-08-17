"use client";

import { BudgetApiType } from "@/schemas/api/budget.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";

import { computeResultatNet } from "./budget.util";
import { getTypePlacesYearRange, getYearRange } from "./date.util";

type DownloadOptions<
  TDownloadRecord extends Record<string, string | number | null>,
> = {
  data: TDownloadRecord[];
  fileName: string;
  sheetName: string;
  headersMap: Record<string, string>;
};

export const downloadDocument = async <
  TDownloadRecord extends Record<string, string | number | null>,
>(
  options: DownloadOptions<TDownloadRecord>
): Promise<void> => {
  const { data, fileName, sheetName, headersMap } = options;

  if (!data || data.length === 0) {
    console.warn("Aucune donnée à exporter.");
    return;
  }

  const targetKeys = Object.keys(headersMap) as (keyof TDownloadRecord)[];

  if (targetKeys.length === 0) {
    console.warn("Aucune colonne à exporter.");
    return;
  }

  const filteredData = data.map((row) => {
    const newRow = {} as Record<string, string | number | null>;
    targetKeys.forEach((key) => {
      newRow[key as string] = row[key] ?? null;
    });
    return newRow;
  });

  const headerTitles = targetKeys.map((key) => headersMap[key as string]);

  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(filteredData, {
    header: targetKeys as string[],
  });

  XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

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

type CombinedFinancialData = Partial<IndicateurFinancierApiType> &
  Partial<BudgetApiType> & {
    year: number;
    resultatNet?: number;
    resultatNetProposeParOperateur?: number;
  };

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
