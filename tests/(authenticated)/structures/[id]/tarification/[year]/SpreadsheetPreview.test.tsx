import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SpreadsheetPreview } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/SpreadsheetPreview";
import type { SpreadsheetPreviewSheet } from "@/utils/spreadsheet-preview.util";

const buildSheet = (
  name: string,
  texts: string[],
  overflowRowCount = 0
): SpreadsheetPreviewSheet => ({
  name,
  zoomRatio: 0.7,
  columns: texts.map((_text, index) => ({
    letter: String.fromCharCode(65 + index),
    widthPx: 64,
  })),
  rows: [
    {
      number: 1,
      heightPt: 30,
      cells: texts.map((text) => ({
        text,
        colSpan: 1,
        rowSpan: 1,
        style: { fontWeight: "bold" },
      })),
    },
  ],
  overflowRowCount,
});

const SHEETS = [
  buildSheet("Budget", ["Loyer", "1 200"]),
  buildSheet("Annexe", ["Note"], 3),
];

describe("SpreadsheetPreview", () => {
  it("affiche la première feuille, et annonce ce que l'aperçu ne montre pas", () => {
    render(<SpreadsheetPreview sheets={SHEETS} />);

    expect(screen.getByText("Loyer")).toBeInTheDocument();
    expect(screen.queryByText("Note")).not.toBeInTheDocument();
    expect(screen.getByText(/graphiques, images/)).toBeInTheDocument();
  });

  it("change de feuille, et annonce les lignes non affichées", async () => {
    render(<SpreadsheetPreview sheets={SHEETS} />);

    await userEvent.click(screen.getByRole("button", { name: "Annexe" }));

    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.queryByText("Loyer")).not.toBeInTheDocument();
    expect(screen.getByText(/3 lignes de plus/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annexe" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("rend la zone de défilement atteignable au clavier, sous le nom de la feuille", () => {
    render(<SpreadsheetPreview sheets={SHEETS} />);

    expect(
      screen.getByRole("region", { name: "Feuille Budget" })
    ).toHaveAttribute("tabindex", "0");
  });

  it("rend le style de chaque cellule et les repères du tableur", () => {
    render(<SpreadsheetPreview sheets={SHEETS} />);

    expect(screen.getByRole("cell", { name: "Loyer" }).style.fontWeight).toBe(
      "bold"
    );
    expect(screen.getByRole("cell", { name: "Loyer" })).toHaveAttribute(
      "title",
      "Loyer"
    );
    expect(screen.getByRole("columnheader", { name: "B" })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "1" })).toBeInTheDocument();
  });

  it("n'affiche pas de sélecteur pour une seule feuille", () => {
    render(<SpreadsheetPreview sheets={[SHEETS[0]]} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
