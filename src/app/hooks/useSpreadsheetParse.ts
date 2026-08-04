import {
  parseSheetData,
  ParseSheetDataError,
  readSheet,
  Schema,
} from "read-excel-file/browser";

import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const useSpreadsheetParse = (): UseExcelParseResult => {
  const parseSpreadsheet = async (
    file: File,
    isMixte: boolean
  ): ParseSpreadsheetResult => {
    const [headerRow, , ...rowsBelowExample] = await readSheet(file);
    const filledRows = rowsBelowExample
      .map((cells, index) => ({
        cells,
        spreadsheetRowNumber: index + FIRST_ADRESSE_ROW_NUMBER,
      }))
      .filter(({ cells }) => cells.some((cell) => cell !== null));

    const parsed = parseSheetData<ImportedAdresseRow>(
      [headerRow, ...filledRows.map(({ cells }) => cells)],
      getSchema(isMixte)
    );

    if (parsed.errors) {
      throw new Error(
        buildErrorMessage(
          parsed.errors,
          filledRows.map(({ spreadsheetRowNumber }) => spreadsheetRowNumber)
        )
      );
    }

    return parsed.objects.map(toFormAdresse);
  };

  const parseAdressesDiffuses = (file: File): ParseSpreadsheetResult => {
    return parseSpreadsheet(file, false);
  };

  const parseAdressesMixtes = (file: File): ParseSpreadsheetResult => {
    return parseSpreadsheet(file, true);
  };

  return { parseAdressesDiffuses, parseAdressesMixtes };
};

const FIRST_ADRESSE_ROW_NUMBER = 3;

const toFormAdresse = (row: ImportedAdresseRow): FormAdresse => ({
  adresse: row.adresse,
  codePostal: row.codePostal,
  commune: row.ville,
  adresseComplete: `${row.adresse} ${row.codePostal} ${row.ville}`,
  departement: row.codePostal.substring(0, 2),
  repartition: row.repartition ?? Repartition.DIFFUS,
  placesAutorisees: row.placesAutorisees,
  isQpv: row.qpv.toLowerCase() === "oui",
  isLogementSocial: row.logementSocial.toLowerCase() === "oui",
});

const buildErrorMessage = (
  errors: ParseSheetDataError[],
  spreadsheetRowNumbers: number[]
): string =>
  errors
    .map(
      (error) =>
        `Valeur invalide (${error.column} : ligne ${spreadsheetRowNumbers[error.row - 1]})`
    )
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
  repartition: {
    column: "Type de bâti",
    type: String,
    oneOf: [Repartition.DIFFUS, Repartition.COLLECTIF],
    required: isMixte,
  },
});

type ImportedAdresseRow = {
  adresse: string;
  codePostal: string;
  ville: string;
  placesAutorisees: number;
  logementSocial: string;
  qpv: string;
  repartition?: Repartition;
};

type ParseSpreadsheetResult = Promise<FormAdresse[]>;

type UseExcelParseResult = {
  parseAdressesDiffuses: (file: File) => ParseSpreadsheetResult;
  parseAdressesMixtes: (file: File) => ParseSpreadsheetResult;
};
