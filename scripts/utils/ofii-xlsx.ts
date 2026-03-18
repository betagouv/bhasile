/**
 * Charge un fichier XLSX OFII (activité), prend l'onglet le plus récent (par date dans le nom),
 * trouve la ligne d'en-tête et normalise les colonnes selon POSSIBLE_COLUMNS.
 * Dépendance : npm install xlsx
 */

import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

const POSSIBLE_REF_COLUMNS: Record<keyof OfiiReferentialRow, string[]> = {
  dnaCode: ["Code"],
  nom: ["Nom du centre", "Nom"],
  type: ["Type", "Catégorie de centre"],
  operateur: ["Opérateur"],
  departement: ["Département"],
  directionTerritoriale: ["Direction territoriale"],
};

const POSSIBLE_ACTIVITE_COLUMNS: Record<keyof ActiviteRow, string[]> = {
  structureDnaCode: ["Code"],
  placesAutorisees: ["Capacité"],
  desinsectisation: ["Désinsectisation"],
  remiseEnEtat: ["Remise en état de l'unité"],
  sousOccupation: ["Sous-occupation"],
  travaux: ["Travaux"],
  placesIndisponibles: ["Total de places indisponibles"],
  presencesInduesBPI: ["Nb de BPI en PI"],
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
  structureId: number;
  dnaCode: string;
  placesAutorisees: number | null;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  travaux: number | null;
  placesIndisponibles: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
};

export type OfiiActiviteSheet = {
  date: Date; // 1er du mois à midi UTC
  rows: ActiviteRow[];
};

export type OfiiFullRow = OfiiReferentialRow & ActiviteRow;

export type OfiiFullSheet = {
  date: Date;
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
  throw new Error(`Année invalide: ${year}`);
}

/** Extrait (year, month) du nom d'onglet (ex. "10 25", "octobre 2025", "Liste") ou null. */
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

/** Extrait (year, month) du nom de fichier "Liste données par centre MM.AA VF.XLSX". */
function parseFilenameDate(
  fileName: string
): { year: number; month: number } | null {
  const match = fileName.match(/(\d{2})[^\d]{1}(\d{2})/);
  if (match) {
    return {
      year: parseInt("20" + match[2], 10),
      month: parseInt(match[1], 10),
    };
  }
  return null;
}

function findHeaderRow(sheet: WorkSheet): number {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  for (let myRow = range.s.r; myRow <= range.e.r; myRow++) {
    const row: string[] = [];
    for (let myCol = range.s.c; myCol <= range.e.c; myCol++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: myRow, c: myCol })];
      const val = cell && cell.v != null ? String(cell.v).trim() : "";
      row.push(val);
    }
    if (row.some((val) => possibleValuesSet.has(val))) {
      return myRow;
    }
  }
  return -1;
}

function normalizeCellValue(val: unknown): string {
  if (val == null) {
    return "";
  }
  return String(val).trim();
}

/**
 * Charge les données référentiel + activité (onglet le plus récent ou "Liste" si présent).
 */
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
      )
      .sort((a, b) => {
        if (a.date.year !== b.date.year) {
          return b.date.year - a.date.year;
        }
        return b.date.month - a.date.month;
      });
    if (withDates.length == 0) {
      throw new Error("Aucune date trouvée dans le nom d'onglet ou du fichier");
    } else {
      chosenSheetName = withDates[0].name;
      sheetDate = withDates[0].date;
    }
  }

  if (!sheetDate) {
    throw new Error(
      `Impossible d'extraire la date du nom d'onglet ou du fichier : ${fileName}`
    );
  }

  const sheet = wb.Sheets[chosenSheetName];

  const headerRowIdx = findHeaderRow(sheet);
  if (headerRowIdx < 0) {
    throw new Error(
      "Aucune ligne d'en-tête trouvée (colonnes OFII attendues)."
    );
  }

  const range = XLSX.utils.decode_range(sheet["!ref"]!);
  const headerRow: string[] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headerRowIdx, c: col })];
    headerRow.push(normalizeCellValue(cell?.v));
  }

  const activiteKeyByIndex: (keyof ActiviteRow | "")[] = [];
  const referentialKeyByIndex: (keyof OfiiReferentialRow | "")[] = [];

  for (const header of headerRow) {
    const normalizedHeader = header.trim().toLowerCase();

    // Colonnes d'activité
    let matchedActiviteKey: keyof ActiviteRow | "" = "";
    (
      Object.entries(POSSIBLE_ACTIVITE_COLUMNS) as [
        keyof ActiviteRow,
        string[],
      ][]
    ).forEach(([key, labels]) => {
      if (
        labels.some((label) => label.trim().toLowerCase() === normalizedHeader)
      ) {
        matchedActiviteKey = key;
      }
    });
    activiteKeyByIndex.push(matchedActiviteKey);

    // Colonnes de référentiel
    let matchedRefKey: keyof OfiiReferentialRow | "" = "";
    (
      Object.entries(POSSIBLE_REF_COLUMNS) as [
        keyof OfiiReferentialRow,
        string[],
      ][]
    ).forEach(([key, labels]) => {
      if (
        labels.some((label) => label.trim().toLowerCase() === normalizedHeader)
      ) {
        matchedRefKey = key;
      }
    });
    referentialKeyByIndex.push(matchedRefKey);
  }

  const rows: OfiiFullRow[] = [];
  for (let rowIndex = headerRowIdx + 1; rowIndex <= range.e.r; rowIndex++) {
    const row: Partial<OfiiFullRow> = {};
    let isEmptyRow = true;

    for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
      const activiteKey = activiteKeyByIndex[columnIndex];
      const referentialKey = referentialKeyByIndex[columnIndex];
      const cell =
        sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
      const rawCellValue = cell?.v;

      if (activiteKey === "structureDnaCode") {
        const value = normalizeCellValue(rawCellValue);
        if (value) {
          row.structureDnaCode = value;
          row.dnaCode = value;
          isEmptyRow = false;
        }
      } else if (activiteKey) {
        const num =
          rawCellValue !== "" &&
          rawCellValue != null &&
          !Number.isNaN(Number(rawCellValue))
            ? Number(rawCellValue)
            : null;
        (row as OfiiFullRow)[activiteKey] = num;
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

  const date = new Date(
    Date.UTC(sheetDate.year, sheetDate.month - 1, 1, 12, 0, 0, 0)
  );

  return { date, rows };
}
