import type { Range, WorkSheet } from "xlsx";
import * as XLSX from "xlsx";

/* Normalise la valeur d'une cellule */
export function normalizeCellValue(val: unknown): string {
  if (val == null) {
    return "";
  }
  return String(val).trim();
}

/* Décode la plage utilisée d'une feuille, "A1" si la feuille est vide. */
export function decodeSheetRange(sheet: WorkSheet): Range {
  return XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
}

/* Valeur brute d'une cellule (row/col en indices 0-based). */
export function getCellValue(
  sheet: WorkSheet,
  row: number,
  col: number
): unknown {
  return sheet[XLSX.utils.encode_cell({ r: row, c: col })]?.v;
}

/* Convertit une valeur de cellule en nombre, ou null si vide/non numérique. */
export function parseNumericCell(raw: unknown): number | null {
  if (raw === "" || raw == null || Number.isNaN(Number(raw))) {
    return null;
  }
  return Number(raw);
}

/**
 * Construit une table de correspondance "libellé d'en-tête normalisé -> clé métier"
 * à partir d'un ou plusieurs libellés possibles par clé.
 */
export function buildLabelLookup<Key extends string>(
  labelsByKey: Record<Key, string | string[]>
): Map<string, Key> {
  const lookup = new Map<string, Key>();
  for (const [key, labels] of Object.entries(labelsByKey) as [
    Key,
    string | string[],
  ][]) {
    const labelList = Array.isArray(labels) ? labels : [labels];
    for (const label of labelList) {
      lookup.set(label.trim().toLowerCase(), key);
    }
  }
  return lookup;
}
