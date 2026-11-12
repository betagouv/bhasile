import { formatDate } from "@/app/utils/date.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { capitalizeFirstLetter } from "@/app/utils/string.util";
import { ImportFile, ImportPreview, ImportResult } from "@/types/import.type";
import { assertImportable } from "@/utils-server/import.server.util";

import {
  findOfiiReferential,
  saveOfiiActivites,
  saveOfiiDnas,
} from "./ofii-import.repository";
import { toOfiiActivite, validateOfiiRows } from "./ofii-import.util";
import { loadOfiiFile } from "./ofii-xlsx.util";

export const previewOfiiImport = async (
  file: ImportFile
): Promise<ImportPreview> => {
  const { month, rows, errors } = await analyzeOfiiFile(file);
  return {
    summary: `${capitalizeFirstLetter(month)} : ${rows.length} structure(s) dans le fichier`,
    details: "Les structures absentes du fichier seront marquées inactives.",
    errors,
  };
};

export const applyOfiiImport = async (
  file: ImportFile
): Promise<ImportResult> => {
  const { date, month, rows, dnas, errors } = await analyzeOfiiFile(file);
  assertImportable(errors);

  const { count } = await saveOfiiDnas(date, dnas);
  await saveOfiiActivites(date, rows.map(toOfiiActivite));

  return {
    summary: `${rows.length} structure(s) importée(s) pour ${month}, ${count} passée(s) inactive(s).`,
  };
};

const analyzeOfiiFile = async ({ buffer, fileName }: ImportFile) => {
  const { date, rows } = loadOfiiFile(buffer, fileName);
  if (rows.length === 0) {
    throw new DomainError("Le fichier ne contient aucune ligne de structure");
  }
  const { dnas, errors } = validateOfiiRows(rows, await findOfiiReferential());
  const month = formatDate(date, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { date, month, rows, dnas, errors };
};
