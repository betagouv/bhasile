"use client";

type DownloadOptions<
  TDownloadRecord extends Record<string, string | number | null>,
> = {
  data: TDownloadRecord[];
  fileName: string;
  sheetName: string;
  headersMap: Record<string, string>;
};

export const downloadDocument = async <
  TDownloadRecord extends Record<string, string | number | null>,
>(
  options: DownloadOptions<TDownloadRecord>
): Promise<void> => {
  const { data, fileName, sheetName, headersMap } = options;

  if (!data || data.length === 0) {
    console.warn("Aucune donnée à exporter.");
    return;
  }

  const targetKeys = Object.keys(headersMap) as (keyof TDownloadRecord)[];

  if (targetKeys.length === 0) {
    console.warn("Aucune colonne à exporter.");
    return;
  }

  const filteredData = data.map((row) => {
    const newRow = {} as Record<string, string | number | null>;
    targetKeys.forEach((key) => {
      newRow[key as string] = row[key] ?? null;
    });
    return newRow;
  });

  const headerTitles = targetKeys.map((key) => headersMap[key as string]);

  const XLSX = await import("xlsx");

  const worksheet = XLSX.utils.json_to_sheet(filteredData, {
    header: targetKeys as string[],
  });

  XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanFileName = fileName.endsWith(".ods")
    ? fileName
    : `${fileName}.ods`;

  XLSX.writeFile(workbook, cleanFileName, { bookType: "ods" });
};
