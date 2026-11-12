import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

import { endOfMonthUtcFromMonth } from "@/app/utils/date.util";
import { DomainError } from "@/app/utils/domain-error.util";
import {
  buildLabelLookup,
  decodeSheetRange,
  getCellValue,
  normalizeCellValue,
  parseNumericCell,
} from "@/utils-server/xlsx.server.util";

const POSSIBLE_REF_COLUMNS: Record<keyof OfiiReferentialRow, string[]> = {
  dnaCode: ["Code"],
  nom: ["Nom du centre", "Nom"],
  type: ["Type", "Catégorie de centre"],
  operateur: ["Opérateur"],
  departement: ["Département"],
  directionTerritoriale: ["Direction territoriale"],
};

const POSSIBLE_ACTIVITE_COLUMNS: Record<keyof ActiviteRow, string[]> = {
  dnaCode: ["Code"],
  placesAutorisees: ["Capacité"],
  desinsectisation: ["Désinsectisation"],
  remiseEnEtat: ["Remise en état de l'unité"],
  sousOccupation: ["Sous-occupation"],
  travaux: ["Travaux"],
  placesIndisponibles: ["Total de places indisponibles"],
  tauxIndisponibilite: ["Taux d'indisponibilité"],
  tauxOccupation: ["Taux d'occupation"],
  placesOccupees: ["Places occupées"],
  tauxBPI: ["% de BPI en PI"],
  presencesInduesBPI: ["Nb de BPI en PI"],
  tauxDeboutes: ["% de DEB en PI"],
  presencesInduesDeboutees: ["Nb de DEB en PI"],
};

export type OfiiReferentialRow = {
  dnaCode: string;
  nom: string;
  type: string;
  operateur: string;
  departement: string;
  directionTerritoriale: string;
};

export type ActiviteRow = {
  dnaCode: string;
  placesAutorisees: number | null;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  travaux: number | null;
  placesIndisponibles: number | null;
  tauxIndisponibilite: number | null;
  tauxOccupation: number | null;
  placesOccupees: number | null;
  tauxBPI: number | null;
  presencesInduesBPI: number | null;
  tauxDeboutes: number | null;
  presencesInduesDeboutees: number | null;
};

export type OfiiActiviteSheet = {
  date: Date; // dernier jour du mois à midi UTC
  rows: ActiviteRow[];
};

export type OfiiFullRow = OfiiReferentialRow & ActiviteRow;

export type OfiiFullSheet = {
  date: Date | null;
  rows: OfiiFullRow[];
};

const MONTHS: Record<string, number> = {
  janvier: 1,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
};

const possibleValuesSet = new Set(
  Object.values(POSSIBLE_ACTIVITE_COLUMNS).flat()
);

function parseYear(year: string): string {
  if (year.length === 2) {
    return "20" + year;
  }
  if (year.length === 4) {
    return year;
  }
  throw new DomainError(`Année invalide dans le nom d’onglet : ${year}`);
}

/* Extrait (year, month) du nom d'onglet (ex. "10 25", "octobre 2025", "Liste") ou null. */
function parseSheetDate(
  sheetName: string
): { year: number; month: number } | null {
  const clean = sheetName.trim().toLowerCase();
  const parts = clean.split(/\s+/);

  let monthNb: number | null = null;
  let yearNb: string | null = null;

  for (const word of parts) {
    if (MONTHS[word] != null) {
      monthNb = MONTHS[word];
    }
    if (/^\d{2,4}$/.test(word)) {
      yearNb = parseYear(word);
    }
  }

  const numMatch = clean.match(/(\d{1,2})[\s\-_/](\d{2,4})/);
  if ((monthNb == null || yearNb == null) && numMatch) {
    const mInt = parseInt(numMatch[1], 10);
    if (mInt >= 1 && mInt <= 12) {
      monthNb = monthNb ?? mInt;
      yearNb = yearNb ?? parseYear(numMatch[2]);
    }
  }

  if (monthNb != null && yearNb != null) {
    return { year: parseInt(yearNb, 10), month: monthNb };
  }
  return null;
}

/* Extrait (year, month) du nom de fichier "Liste données par centre MM.AA VF.XLSX". */
function parseFilenameDate(
  fileName: string
): { year: number; month: number } | null {
  for (const match of fileName.matchAll(/(\d{2})[^\d](\d{2})(?!\d)/g)) {
    const month = parseInt(match[1], 10);
    if (month >= 1 && month <= 12) {
      return { year: parseInt("20" + match[2], 10), month };
    }
  }
  return null;
}

function findHeaderRow(sheet: WorkSheet): number {
  const range = decodeSheetRange(sheet);
  for (let myRow = range.s.r; myRow <= range.e.r; myRow++) {
    const row: string[] = [];
    for (let myCol = range.s.c; myCol <= range.e.c; myCol++) {
      row.push(normalizeCellValue(getCellValue(sheet, myRow, myCol)));
    }
    if (row.some((val) => possibleValuesSet.has(val))) {
      return myRow;
    }
  }
  return -1;
}

/* Charge les données référentiel + activité de l'onglet « Liste », sinon de l'unique onglet daté */
export function loadOfiiFile(buffer: Buffer, fileName: string): OfiiFullSheet {
  const wb = XLSX.read(buffer, { type: "buffer", raw: true });
  const sheetNames = wb.SheetNames;

  let chosenSheetName: string;
  let sheetDate: { year: number; month: number } | null;

  const listeIndex = sheetNames.findIndex(
    (name) => name.trim().toLowerCase() == "liste"
  );

  if (listeIndex >= 0) {
    chosenSheetName = sheetNames[listeIndex];
    sheetDate = parseFilenameDate(fileName);
  } else {
    const withDates = sheetNames
      .map((name) => ({ name, date: parseSheetDate(name) }))
      .filter(
        (x): x is { name: string; date: { year: number; month: number } } =>
          x.date != null
      );
    if (withDates.length === 0) {
      throw new DomainError(
        "Aucun onglet « Liste » ni onglet daté (ex. « octobre 2025 ») dans le fichier"
      );
    }
    if (withDates.length > 1) {
      throw new DomainError(
        `Le fichier contient plusieurs onglets datés (${withDates.map(({ name }) => `« ${name} »`).join(", ")}) : gardez un seul onglet, nommé « Liste »`
      );
    }
    chosenSheetName = withDates[0].name;
    sheetDate = withDates[0].date;
  }

  const sheet = wb.Sheets[chosenSheetName];

  const headerRowIdx = findHeaderRow(sheet);
  if (headerRowIdx < 0) {
    throw new DomainError(
      "Aucune ligne d’en-tête trouvée : les colonnes OFII attendues (Code, Capacité…) sont absentes"
    );
  }

  const range = decodeSheetRange(sheet);
  const headerRow: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    headerRow.push(normalizeCellValue(getCellValue(sheet, headerRowIdx, col)));
  }

  const activiteKeyByLabel = buildLabelLookup(POSSIBLE_ACTIVITE_COLUMNS);
  const referentialKeyByLabel = buildLabelLookup(POSSIBLE_REF_COLUMNS);

  const activiteKeyByIndex: (keyof ActiviteRow | "")[] = [];
  const referentialKeyByIndex: (keyof OfiiReferentialRow | "")[] = [];

  for (const header of headerRow) {
    const normalizedHeader = header.trim().toLowerCase();
    activiteKeyByIndex.push(activiteKeyByLabel.get(normalizedHeader) ?? "");
    referentialKeyByIndex.push(
      referentialKeyByLabel.get(normalizedHeader) ?? ""
    );
  }

  const rows: OfiiFullRow[] = [];
  for (let rowIndex = headerRowIdx + 1; rowIndex <= range.e.r; rowIndex++) {
    const row: Partial<OfiiFullRow> = {};
    let isEmptyRow = true;

    for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
      const activiteKey = activiteKeyByIndex[columnIndex];
      const referentialKey = referentialKeyByIndex[columnIndex];
      const rawCellValue = getCellValue(sheet, rowIndex, columnIndex);

      if (activiteKey === "dnaCode") {
        const value = normalizeCellValue(rawCellValue);
        if (value) {
          row.dnaCode = value;
          isEmptyRow = false;
        }
      } else if (activiteKey) {
        (row as OfiiFullRow)[activiteKey] = parseNumericCell(rawCellValue);
      } else if (referentialKey) {
        const value = normalizeCellValue(rawCellValue);
        if (value) {
          (row as OfiiFullRow)[referentialKey] = value;
        }
      }
    }

    if (isEmptyRow) {
      break;
    }
    rows.push(row as OfiiFullRow);
  }

  const date = sheetDate
    ? endOfMonthUtcFromMonth(sheetDate.year, sheetDate.month)
    : null;

  return { date, rows };
}
