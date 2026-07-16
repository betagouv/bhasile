/**
 * Charge un fichier XLSX "Suivi RMU" (référés mesures utiles / sorties administratives).
 * Dépendance : npm install xlsx
 */

import type { WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

import {
  buildLabelLookup,
  decodeSheetRange,
  getCellValue,
  normalizeCellValue,
  parseNumericCell,
} from "./xlsx-utils";

export type RmuCategorieKey =
  | "deboutesSansMesureAdministrative"
  | "misesEnDemeure"
  | "referesEngages"
  | "referesExecutes";

const CATEGORIE_LABELS: Record<RmuCategorieKey, string> = {
  deboutesSansMesureAdministrative:
    "Nombre de déboutés sortis du DNA sans mesure administrative",
  misesEnDemeure: "Nombre de mises en demeure du préfet de quitter les lieux",
  referesEngages: "Nombre de référés mesures utiles engagés",
  referesExecutes: "Nombre de référés mesures utiles exécutés",
};

const categorieKeyByLabel = buildLabelLookup(CATEGORIE_LABELS);

export type RmuRow = {
  departementNom: string;
  date: Date;
} & Record<RmuCategorieKey, number | null>;

const COMMENTAIRES_HEADER = "commentaires";
const CUMUL_HEADER_PREFIX = "cumul";
// Décalage des colonnes
const DEPARTEMENT_COL_OFFSET = 0;
const CATEGORIE_COL_OFFSET = 1;
const FIRST_MONTH_COL_OFFSET = 2;

// Epoque Excel (1900, avec le bug de l'année bissextile pris en compte par les libs)
const EXCEL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);

/* Convertit un numéro de série Excel en date UTC à midi (convention utilisée ailleurs dans le projet) */
function excelSerialToDate(serial: number): Date {
  const utcMidnight = EXCEL_EPOCH_UTC_MS + serial * 86400 * 1000;
  return new Date(utcMidnight + 12 * 3600 * 1000);
}

/* Les RMU sont des données mensuelles : chaque colonne au dernier jour du mois */
function excelSerialToMonthEnd(serial: number): Date {
  const date = excelSerialToDate(serial);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)
  );
}

type HeaderInfo = {
  monthColumns: { col: number; date: Date }[];
};

function readHeaderInfo(
  sheet: WorkSheet,
  row: number,
  firstCol: number,
  lastCol: number
): HeaderInfo | null {
  const firstMonthCol = firstCol + FIRST_MONTH_COL_OFFSET;
  let commentairesCol = -1;
  let cumulCol = -1;
  for (let col = firstMonthCol; col <= lastCol; col++) {
    const value = normalizeCellValue(
      getCellValue(sheet, row, col)
    ).toLowerCase();
    if (value === COMMENTAIRES_HEADER) {
      commentairesCol = col;
    }
    if (value.startsWith(CUMUL_HEADER_PREFIX)) {
      cumulCol = col;
    }
  }

  if (commentairesCol < 0 || cumulCol < 0) {
    return null;
  }

  const monthColumns: { col: number; date: Date }[] = [];
  for (let col = firstMonthCol; col < cumulCol; col++) {
    const raw = getCellValue(sheet, row, col);
    if (typeof raw !== "number") {
      throw new Error(
        `En-tête de mois invalide (ligne ${row + 1}, colonne ${col + 1}) : valeur non numérique "${raw}"`
      );
    }
    monthColumns.push({ col, date: excelSerialToMonthEnd(raw) });
  }

  return { monthColumns };
}

function parseSheet(sheet: WorkSheet): RmuRow[] {
  const range = decodeSheetRange(sheet);
  const rows: RmuRow[] = [];
  const departementCol = range.s.c + DEPARTEMENT_COL_OFFSET;
  const categorieCol = range.s.c + CATEGORIE_COL_OFFSET;

  let currentHeader: HeaderInfo | null = null;
  let currentBlockName: string | null = null;
  const accByKey = new Map<string, RmuRow>();

  for (let row = range.s.r; row <= range.e.r; row++) {
    const header = readHeaderInfo(sheet, row, range.s.c, range.e.c);
    if (header) {
      currentHeader = header;
      currentBlockName = null;
      continue;
    }

    if (!currentHeader) {
      continue;
    }

    const blockNameCell = normalizeCellValue(
      getCellValue(sheet, row, departementCol)
    );
    if (blockNameCell) {
      currentBlockName = blockNameCell;
    }

    const categorieLabel = normalizeCellValue(
      getCellValue(sheet, row, categorieCol)
    );
    const categorieKey = categorieKeyByLabel.get(categorieLabel.toLowerCase());
    if (!categorieKey || !currentBlockName) {
      continue;
    }

    for (const { col, date } of currentHeader.monthColumns) {
      const value = parseNumericCell(getCellValue(sheet, row, col));
      if (value === null) {
        continue;
      }

      const key = `${currentBlockName}|${date.toISOString()}`;
      const existing = accByKey.get(key);
      const rmuRow: RmuRow = existing ?? {
        departementNom: currentBlockName,
        date,
        deboutesSansMesureAdministrative: null,
        misesEnDemeure: null,
        referesEngages: null,
        referesExecutes: null,
      };
      rmuRow[categorieKey] = value;
      if (!existing) {
        accByKey.set(key, rmuRow);
        rows.push(rmuRow);
      }
    }
  }

  return rows;
}

/* Un fichier "Suivi RMU" ne contient qu'un seul onglet, pour une seule région. */
export function loadRmuFile(buffer: Buffer): RmuRow[] {
  const wb = XLSX.read(buffer, { type: "buffer", raw: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("Le fichier XLSX RMU ne contient aucun onglet.");
  }
  return parseSheet(wb.Sheets[sheetName]);
}
