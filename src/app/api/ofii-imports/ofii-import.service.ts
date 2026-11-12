import {
  endOfMonthUtcFromMonthKey,
  formatMonthLabel,
  toMonthKey,
} from "@/app/utils/date.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { formatPlural, pluralize } from "@/app/utils/string.util";
import { ImportFile, ImportPreview, ImportResult } from "@/types/import.type";
import { assertImportable } from "@/utils-server/import.server.util";

import {
  findLatestOfiiActiviteDate,
  findOfiiDnaChanges,
  findOfiiReferential,
  saveOfiiImport,
} from "./ofii-import.repository";
import {
  describeOfiiChanges,
  toOfiiActivite,
  validateOfiiRows,
} from "./ofii-import.util";
import { loadOfiiFile } from "./ofii-xlsx.util";

export const previewOfiiImport = async (
  file: ImportFile
): Promise<ImportPreview> => {
  const { detectedDate, rows, dnas, errors } = await analyzeOfiiFile(file);
  const codes = dnas.map(({ code }) => code);
  const changes =
    errors.length === 0
      ? [
          ...describeOfiiChanges({
            codes,
            ...(await findOfiiDnaChanges(codes)),
          }),
          `Activité du mois enregistrée pour ${formatPlural(rows.length, "structure")}`,
        ]
      : [];
  const latestImportedDate = await findLatestOfiiActiviteDate();
  return {
    summary: `${formatPlural(rows.length, "structure")} dans le fichier`,
    changes,
    detectedMonth: detectedDate && toMonthKey(detectedDate),
    latestImportedMonth: latestImportedDate && toMonthKey(latestImportedDate),
    errors,
  };
};

export const applyOfiiImport = async (
  file: ImportFile
): Promise<ImportResult> => {
  const { detectedDate, rows, dnas, errors } = await analyzeOfiiFile(file);
  assertImportable(errors);
  const date = file.month
    ? endOfMonthUtcFromMonthKey(file.month)
    : detectedDate;
  if (!date) {
    throw new DomainError(
      "Indiquez le mois des données : il n’a pas pu être déduit du fichier"
    );
  }

  const count = await saveOfiiImport(date, dnas, rows.map(toOfiiActivite));

  const month = formatMonthLabel(date);
  return {
    summary: `${formatPlural(rows.length, "structure")} ${pluralize(rows.length, "importée")} pour ${month}, ${formatPlural(count, "structure")} ${pluralize(count, "passée")} ${pluralize(count, "inactive")}.`,
  };
};

const analyzeOfiiFile = async ({ buffer, fileName }: ImportFile) => {
  const { date: detectedDate, rows } = loadOfiiFile(buffer, fileName);
  if (rows.length === 0) {
    throw new DomainError("Le fichier ne contient aucune ligne de structure");
  }
  const { dnas, errors } = validateOfiiRows(rows, await findOfiiReferential());
  return { detectedDate, rows, dnas, errors };
};
