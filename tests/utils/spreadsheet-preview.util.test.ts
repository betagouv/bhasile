import { Workbook, type Worksheet } from "exceljs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import {
  parseSpreadsheetPreview,
  type SpreadsheetPreviewSheet,
} from "@/utils/spreadsheet-preview.util";

const NARROW_SPACE = " ";

const buildWorkbook = async (
  fillWorkbook: (workbook: Workbook) => void
): Promise<Blob> => {
  const workbook = new Workbook();
  fillWorkbook(workbook);
  return new Blob([await workbook.xlsx.writeBuffer()]);
};

const parseSheet = async (
  fillSheet: (worksheet: Worksheet) => void
): Promise<SpreadsheetPreviewSheet> => {
  const [sheet] = await parseSpreadsheetPreview(
    await buildWorkbook((workbook) =>
      fillSheet(workbook.addWorksheet("Budget"))
    )
  );
  return sheet;
};

const readTexts = ({ rows }: SpreadsheetPreviewSheet): string[][] =>
  rows.map(({ cells }) => cells.map(({ text }) => text));

const WORKSHEET_TARGET = "worksheets/sheet";

// ExcelJS et xlsx n'écrivent pas de feuille de graphique : seule sa relation la distingue d'une feuille de données
const buildSpreadsheetEndingWithChart = (sheetNames: string[]): Blob => {
  const workbook = XLSX.utils.book_new();
  for (const name of sheetNames) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([[name]]),
      name
    );
  }
  const archive = XLSX.CFB.read(
    new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" })),
    { type: "array" }
  );
  const relations = XLSX.CFB.find(archive, "/xl/_rels/workbook.xml.rels");
  const content = Buffer.from(relations.content).toString("utf-8");
  const targetIndex = content.lastIndexOf(WORKSHEET_TARGET);
  relations.content = Buffer.from(
    `${content.slice(0, targetIndex)}chartsheets/sheet${content.slice(targetIndex + WORKSHEET_TARGET.length)}`
  );
  return new Blob([
    new Uint8Array(XLSX.CFB.write(archive, { fileType: "zip", type: "array" })),
  ]);
};

describe("parseSpreadsheetPreview", () => {
  it("lit toutes les feuilles visibles, sous leur nom", async () => {
    const sheets = await parseSpreadsheetPreview(
      await buildWorkbook((workbook) => {
        workbook.addWorksheet("Budget").addRow(["Poste"]);
        workbook.addWorksheet("Annexe").addRow(["Note"]);
        workbook.addWorksheet("Listes", { state: "hidden" }).addRow(["Caché"]);
      })
    );

    expect(sheets.map(({ name }) => name)).toEqual(["Budget", "Annexe"]);
    expect(readTexts(sheets[1])).toEqual([["Note"]]);
  });

  it("applique le format de nombre du fichier, à la française", async () => {
    const sheet = await parseSheet((worksheet) => {
      const row = worksheet.addRow([1234.5, 0.125, 1234.56789, 750000000]);
      row.getCell(1).numFmt = "#,##0.00";
      row.getCell(2).numFmt = "0.0%";
    });

    expect(readTexts(sheet)[0]).toEqual([
      `1${NARROW_SPACE}234,50`,
      "12,5%",
      "1234,56789",
      "750000000",
    ]);
  });

  it("garde l'heure d'une cellule qui en affiche une, sans date si elle n'en a pas", async () => {
    const sheet = await parseSheet((worksheet) => {
      const row = worksheet.addRow([
        new Date(Date.UTC(2027, 2, 31)),
        new Date(Date.UTC(2027, 2, 31, 14, 30)),
        new Date(Date.UTC(1899, 11, 30, 14, 30)),
      ]);
      row.getCell(1).numFmt = "dd/mm/yyyy";
      row.getCell(2).numFmt = "dd/mm/yyyy hh:mm";
      row.getCell(3).numFmt = "hh:mm";
    });

    expect(readTexts(sheet)[0]).toEqual([
      "31/03/2027",
      expect.stringMatching(/^31\/03\/2027.*14:30$/),
      "14:30",
    ]);
  });

  it("suit le format du fichier pour une durée ou des secondes", async () => {
    const sheet = await parseSheet((worksheet) => {
      const row = worksheet.addRow([1.5, 14.5 / 1440, 0.604340277]);
      row.getCell(1).numFmt = "[h]:mm";
      row.getCell(2).numFmt = "mm:ss";
      row.getCell(3).numFmt = "h:mm:ss";
    });

    expect(readTexts(sheet)[0]).toEqual(["36:00", "14:30", "14:30:15"]);
  });

  it("affiche à la française une date au format américain d'Excel", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.addRow([new Date(Date.UTC(2027, 2, 31))]).getCell(1).numFmt =
        "mm-dd-yy";
    });

    expect(readTexts(sheet)[0]).toEqual(["31/03/2027"]);
  });

  it("affiche le résultat d'une formule, un texte enrichi, un lien et une erreur", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.addRow([
        { formula: "1+1", result: 2 },
        { richText: [{ text: "Loyer " }, { text: "net" }] },
        { text: "Site", hyperlink: "javascript:alert(1)" },
        { formula: "1/0", result: { error: "#DIV/0!" } },
        true,
      ]);
    });

    expect(readTexts(sheet)[0]).toEqual([
      "2",
      "Loyer net",
      "Site",
      "#DIV/0!",
      "Oui",
    ]);
  });

  it("reprend les fusions, sans répéter les cellules fusionnées", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.getCell("A1").value = "Titre";
      worksheet.getCell("C1").value = "Fin";
      worksheet.getCell("C2").value = "Bas";
      worksheet.mergeCells("A1:B2");
    });

    expect(readTexts(sheet)).toEqual([["Titre", "Fin"], ["Bas"]]);
    expect(sheet.rows[0].cells[0]).toMatchObject({ colSpan: 2, rowSpan: 2 });
  });

  it("reprend les bordures portées par les cellules de bord d'une fusion", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.getCell("A1").value = "Titre";
      worksheet.mergeCells("A1:B2");
      worksheet.getCell("B1").style = {
        border: { right: { style: "thin", color: { argb: "FF0000FF" } } },
      };
      worksheet.getCell("A2").style = {
        border: { bottom: { style: "medium", color: { argb: "FFFF0000" } } },
      };
    });

    expect(sheet.rows[0].cells[0].style).toMatchObject({
      borderRight: "1px solid #0000FF",
      borderBottom: "2px solid #FF0000",
    });
  });

  it("ne répète pas la valeur d'une fusion dont la cellule maîtresse est masquée", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.getCell("A1").value = "1200";
      worksheet.getCell("B3").value = "Fin";
      worksheet.mergeCells("A1:A3");
      worksheet.getRow(1).hidden = true;
    });

    expect(readTexts(sheet)).toEqual([
      ["", ""],
      ["", "Fin"],
    ]);
  });

  it("signale par des points de suspension un nombre qui peut être coupé", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.addRow([1086160]);
    });

    expect(sheet.rows[0].cells[0].style).toMatchObject({
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
  });

  it("reprend la mise en forme des cellules", async () => {
    const sheet = await parseSheet((worksheet) => {
      const cell = worksheet.getCell("A1");
      cell.value = "Total";
      cell.font = { bold: true, size: 14, color: { argb: "FFFF0000" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF00FF00" },
      };
      cell.alignment = { horizontal: "center", wrapText: true };
      cell.border = { top: { style: "medium", color: { argb: "FF0000FF" } } };
      worksheet.getColumn(1).width = 20;
      worksheet.getRow(1).height = 30;
    });

    expect(sheet.rows[0].heightPt).toBe(30);
    expect(sheet.columns[0]).toEqual({ letter: "A", widthPx: 145 });
    expect(sheet.rows[0].cells[0].style).toMatchObject({
      fontWeight: "bold",
      fontSize: "14pt",
      color: "#FF0000",
      backgroundColor: "#00FF00",
      textAlign: "center",
      whiteSpace: "pre-wrap",
      borderTop: "2px solid #0000FF",
    });
  });

  it("résout une couleur du thème, avec sa nuance", async () => {
    const sheet = await parseSheet((worksheet) => {
      const cell = worksheet.getCell("A1");
      cell.value = "Total";
      cell.font = { color: { theme: 1, tint: 0 } as never };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { theme: 0, tint: -0.5 } as never,
      };
    });

    expect(sheet.rows[0].cells[0].style).toMatchObject({
      color: "#000000",
      backgroundColor: "#808080",
    });
  });

  it("résout une couleur de la palette indexée, et ignore une couleur système", async () => {
    const sheet = await parseSheet((worksheet) => {
      const cell = worksheet.getCell("A1");
      cell.value = "Total";
      cell.font = { color: { indexed: 64 } as never };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { indexed: 47 } as never,
      };
    });

    expect(sheet.rows[0].cells[0].style.backgroundColor).toBe("#FFCC99");
    expect(sheet.rows[0].cells[0].style.color).toBeUndefined();
  });

  it("ignore une couleur qui n'est pas un code hexadécimal", async () => {
    const sheet = await parseSheet((worksheet) => {
      const cell = worksheet.getCell("A1");
      cell.value = "Total";
      cell.font = { color: { argb: "url(https://exemple.test)" } };
    });

    expect(sheet.rows[0].cells[0].style.color).toBeUndefined();
  });

  it("aligne les nombres à droite et le texte à gauche, par défaut", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.addRow(["Loyer", 1200]);
    });

    expect(sheet.rows[0].cells.map(({ style }) => style.textAlign)).toEqual([
      "left",
      "right",
    ]);
  });

  it("laisse un texte déborder sur une voisine vide, pas sur une voisine remplie", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.getCell("A1").value = "Long titre";
      worksheet.getCell("C1").value = "Autre";
      worksheet.getCell("D1").value = "Fin";
    });

    expect(sheet.rows[0].cells.map(({ style }) => style.overflow)).toEqual([
      "visible",
      "hidden",
      "hidden",
      "visible",
    ]);
  });

  it("masque les lignes et les colonnes masquées", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.addRow(["A1", "B1"]);
      worksheet.addRow(["A2", "B2"]);
      worksheet.addRow(["A3", "B3"]);
      worksheet.getRow(2).hidden = true;
      worksheet.getColumn(2).hidden = true;
    });

    expect(readTexts(sheet)).toEqual([["A1"], ["A3"]]);
    expect(sheet.rows.map(({ number }) => number)).toEqual([1, 3]);
    expect(sheet.columns.map(({ letter }) => letter)).toEqual(["A"]);
  });

  it("ne garde pas les cellules vides mises en forme au bas d'un modèle", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.getCell("A1").value = "Loyer";
      worksheet.getCell("F500").font = { bold: true };
    });

    expect(sheet.rows).toHaveLength(1);
    expect(sheet.columns).toHaveLength(1);
  });

  it("reprend le zoom de la feuille", async () => {
    const sheet = await parseSheet((worksheet) => {
      worksheet.views = [{ zoomScale: 70 }];
      worksheet.addRow(["Loyer"]);
    });

    expect(sheet.zoomRatio).toBe(0.7);
  });

  it("borne le nombre de lignes affichées, et compte le reste", async () => {
    const sheet = await parseSheet((worksheet) => {
      for (let index = 0; index < 1005; index += 1) {
        worksheet.addRow([`L${index}`]);
      }
    });

    expect(sheet.rows).toHaveLength(1000);
    expect(sheet.overflowRowCount).toBe(5);
  });

  it("lit aussi un classeur écrit par un autre logiciel, en xlsm", async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([["Loyer"]]),
      "Budget"
    );

    const [sheet] = await parseSpreadsheetPreview(
      new Blob([XLSX.write(workbook, { type: "array", bookType: "xlsm" })])
    );

    expect(readTexts(sheet)).toEqual([["Loyer"]]);
  });

  it("ignore une feuille de graphique, et lit les autres", async () => {
    const sheets = await parseSpreadsheetPreview(
      buildSpreadsheetEndingWithChart(["Budget", "Graphique"])
    );

    expect(sheets.map(({ name }) => name)).toEqual(["Budget"]);
  });

  it("rejette un classeur sans feuille à afficher", async () => {
    await expect(
      parseSpreadsheetPreview(buildSpreadsheetEndingWithChart(["Graphique"]))
    ).rejects.toThrow();
  });

  it("rejette un fichier qui n'est pas un classeur", async () => {
    await expect(
      parseSpreadsheetPreview(new Blob(["pas un tableur"]))
    ).rejects.toThrow();
  });
});
