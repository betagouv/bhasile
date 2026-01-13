import readXlsxFile, { Schema } from "read-excel-file";

import { CURRENT_YEAR } from "@/constants";
import { FormAdresse } from "@/schemas/forms/base/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const useSpreadsheetParse = (): UseExcelParseResult => {
  const parseSpreadsheet = async (
    file: File,
    repartitionColumnIndex: number,
    isMixte: boolean
  ): ParseXlsxResult => {
    const adresses: FormAdresse[] = [];
    const schema = getSchema(isMixte);
    const { rows, errors } = await readXlsxFile(file, { schema });
    const filteredErrors = errors.filter((error) => error.row !== 2);
    if (filteredErrors.length > 0) {
      const errorMessage = filteredErrors
        .map(
          (error) => `Valeur invalide (${error.column} : ligne ${error.row})`
        )
        .join(", ");
      throw new Error(errorMessage);
    }
    rows.shift();
    rows.forEach((row) => {
      const adresse = {
        adresse: row.adresse,
        codePostal: row.codePostal,
        commune: row.ville,
        adresseComplete: `${row.adresse} ${row.codePostal} ${row.ville}`,
        departement: String(row.codePostal).substring(0, 2),
        repartition:
          repartitionColumnIndex === -1 ? Repartition.DIFFUS : row.repartition,
        adresseTypologies: [
          {
            placesAutorisees: row.placesAutorisees,
            year: CURRENT_YEAR,
            qpv: row.qpv?.toLowerCase() === "oui",
            logementSocial: row.logementSocial?.toLowerCase() === "oui",
          },
        ],
      } as unknown as FormAdresse;
      adresses.push(adresse);
    });
    return adresses;
  };

  const parseAdressesDiffuses = async (file: File): ParseXlsxResult => {
    return parseSpreadsheet(file, -1, false);
  };

  const parseAdressesMixtes = (file: File): ParseXlsxResult => {
    return parseSpreadsheet(file, 6, true);
  };

  return { parseAdressesDiffuses, parseAdressesMixtes };
};

const getSchema = (isMixte: boolean): Schema => ({
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

type ParseXlsxResult = Promise<FormAdresse[]>;

type UseExcelParseResult = {
  parseAdressesDiffuses: (file: File) => ParseXlsxResult;
  parseAdressesMixtes: (file: File) => ParseXlsxResult;
};
