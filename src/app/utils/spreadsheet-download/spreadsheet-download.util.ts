"use client";

import {
  DownloadOptions,
  SheetOption,
} from "@/types/spreadsheet-download.type";

export const downloadDocument = async <TRecord extends Record<string, unknown>>(
  options: DownloadOptions<TRecord>
): Promise<void> => {
  const { fileName } = options;

  let sheetsToProcess: SheetOption<Record<string, unknown>>[] = [];

  if (options.sheets) {
    sheetsToProcess = options.sheets;
  } else if (options.data && options.headersMap && options.sheetName) {
    sheetsToProcess = [
      {
        sheetName: options.sheetName,
        data: options.data,
        headersMap: options.headersMap,
        emptyMessage: options.emptyMessage,
      },
    ];
  }

  if (sheetsToProcess.length === 0) {
    console.warn("Aucune donnée ni feuille à exporter.");
    return;
  }

  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  for (const sheetOption of sheetsToProcess) {
    const { sheetName, data, headersMap, emptyMessage } = sheetOption;
    const targetKeys = Object.keys(headersMap);

    let worksheet: import("xlsx").WorkSheet;

    if (!data || data.length === 0) {
      worksheet = XLSX.utils.aoa_to_sheet([[emptyMessage || "Pas de données"]]);
    } else {
      const filteredData = data.map((row) => {
        const newRow: Record<string, unknown> = {};
        targetKeys.forEach((key) => {
          newRow[key] = row[key] ?? null;
        });
        return newRow;
      });

      const headerTitles = targetKeys.map((key) => headersMap[key]);

      worksheet = XLSX.utils.json_to_sheet(filteredData, {
        header: targetKeys,
      });

      XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  const cleanFileName = fileName.endsWith(".ods")
    ? fileName
    : `${fileName}.ods`;

  XLSX.writeFile(workbook, cleanFileName, { bookType: "ods" });
};
