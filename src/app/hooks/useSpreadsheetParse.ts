import {
  parseSheetData,
  ParseSheetDataError,
  readSheet,
  Row,
  Schema,
} from "read-excel-file/browser";

import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const useSpreadsheetParse = (): UseExcelParseResult => {
  const parseSpreadsheet = async (
    file: File,
    isMixte: boolean
  ): ParseSpreadsheetResult => {
    const [headerRow, ...rowsBelowHeader] = await readSheet(file);
    const filledRows = rowsBelowHeader
      .map((cells, index) => ({
        cells,
        spreadsheetRowNumber: index + FIRST_ROW_BELOW_HEADER_NUMBER,
      }))
      .filter(({ cells }) => cells.some((cell) => cell !== null));
    const adresseRows = isExampleRow(filledRows[0]?.cells)
      ? filledRows.slice(1)
      : filledRows;

    const parsed = parseSheetData<ImportedAdresseRow>(
      [headerRow, ...adresseRows.map(({ cells }) => cells)],
      getSchema(isMixte)
    );

    if (parsed.errors) {
      throw new Error(buildErrorMessage(parsed.errors, adresseRows));
    }

    if (parsed.objects.length === 0) {
      throw new Error("Aucune adresse n'a été trouvée dans le tableur");
    }

    return parsed.objects.map((row) => buildFormAdresse(row, isMixte));
  };

  const parseAdressesDiffuses = (file: File): ParseSpreadsheetResult => {
    return parseSpreadsheet(file, false);
  };

  const parseAdressesMixtes = (file: File): ParseSpreadsheetResult => {
    return parseSpreadsheet(file, true);
  };

  return { parseAdressesDiffuses, parseAdressesMixtes };
};

const FIRST_ROW_BELOW_HEADER_NUMBER = 2;

const EXAMPLE_CELL_PREFIX = "Ex :";

const isExampleRow = (cells: Row | undefined): boolean => {
  const firstCell = cells?.[0];

  return (
    typeof firstCell === "string" && firstCell.startsWith(EXAMPLE_CELL_PREFIX)
  );
};

const buildFormAdresse = (
  row: ImportedAdresseRow,
  isMixte: boolean
): FormAdresse => ({
  adresse: row.adresse,
  codePostal: row.codePostal,
  commune: row.ville,
  adresseComplete: `${row.adresse} ${row.codePostal} ${row.ville}`,
  departement: row.codePostal.substring(0, 2),
  repartition: isMixte ? parseRepartition(row.typeBati) : Repartition.DIFFUS,
  placesAutorisees: row.placesAutorisees,
  isQpv: row.qpv.toLowerCase() === "oui",
  isLogementSocial: row.logementSocial.toLowerCase() === "oui",
});

const parseRepartition = (typeBati: string | undefined): Repartition =>
  typeBati?.toUpperCase() === Repartition.COLLECTIF
    ? Repartition.COLLECTIF
    : Repartition.DIFFUS;

const buildErrorMessage = (
  errors: ParseSheetDataError[],
  filledRows: FilledRow[]
): string =>
  errors
    .map((error) => {
      const rowNumber = filledRows[error.row - 1]?.spreadsheetRowNumber;

      return `Valeur invalide (${error.column} : ligne ${rowNumber ?? "inconnue"})`;
    })
    .join(", ");

const getSchema = (isMixte: boolean): Schema<ImportedAdresseRow> => ({
  adresse: {
    column: "Adresse",
    type: String,
    required: true,
  },
  codePostal: {
    column: "Code postal",
    type: String,
    required: true,
  },
  ville: {
    column: "Ville",
    type: String,
    required: true,
  },
  placesAutorisees: {
    column: "Places autorisées",
    type: Number,
    required: true,
    validate: (value) => {
      if (value < 1) {
        throw new Error(
          "Le nombre de places autorisées doit être au moins de 1"
        );
      }
    },
  },
  logementSocial: {
    column: "Logement social",
    type: String,
    oneOf: ["Oui", "oui", "OUI", "Non", "non", "NON"],
    required: true,
  },
  qpv: {
    column: "QPV",
    type: String,
    oneOf: ["Oui", "oui", "OUI", "Non", "non", "NON"],
    required: true,
  },
  typeBati: {
    column: "Type de bâti",
    type: String,
    oneOf: ["Collectif", "collectif", "COLLECTIF", "Diffus", "diffus", "DIFFUS"],
    required: isMixte,
  },
});

type FilledRow = {
  cells: Row;
  spreadsheetRowNumber: number;
};

type ImportedAdresseRow = {
  adresse: string;
  codePostal: string;
  ville: string;
  placesAutorisees: number;
  logementSocial: string;
  qpv: string;
  typeBati?: string;
};

type ParseSpreadsheetResult = Promise<FormAdresse[]>;

type UseExcelParseResult = {
  parseAdressesDiffuses: (file: File) => ParseSpreadsheetResult;
  parseAdressesMixtes: (file: File) => ParseSpreadsheetResult;
};
