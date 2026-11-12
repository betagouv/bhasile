import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { loadOfiiFile } from "@/app/api/ofii-imports/ofii-xlsx.util";

const OFII_ROWS = [
  [
    "Code",
    "Nom",
    "Catégorie de centre",
    "Opérateur",
    "Département",
    "Capacité",
  ],
  ["C0301", "CADA MOULINS", "CADA", "ADOMA", "Allier", 80],
];

const buildWorkbook = (sheetNames: string[]): Buffer => {
  const workbook = XLSX.utils.book_new();
  for (const name of sheetNames) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(OFII_ROWS),
      name
    );
  }
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

describe("loadOfiiFile", () => {
  it("lit l'onglet Liste et déduit le mois du nom du fichier", () => {
    const { date, rows } = loadOfiiFile(
      buildWorkbook(["Liste", "09 26"]),
      "Liste données par centre 09.26 VF.xlsx"
    );

    expect(date).toEqual(new Date("2026-09-30T12:00:00Z"));
    expect(rows.map(({ dnaCode }) => dnaCode)).toEqual(["C0301"]);
  });

  it("lit l'unique onglet daté quand il n'y a pas d'onglet Liste", () => {
    const { date } = loadOfiiFile(buildWorkbook(["octobre 2025"]), "ofii.xlsx");

    expect(date).toEqual(new Date("2025-10-31T12:00:00Z"));
  });

  it("refuse un fichier avec plusieurs onglets datés", () => {
    expect(() =>
      loadOfiiFile(buildWorkbook(["09 25", "10 25"]), "ofii.xlsx")
    ).toThrow(/plusieurs onglets datés/);
  });

  it("laisse le mois à saisir quand le nom du fichier ne contient pas de mois valide", () => {
    const { date } = loadOfiiFile(
      buildWorkbook(["Liste"]),
      "Liste 2025-10-03.xlsx"
    );

    expect(date).toBeNull();
  });
});
