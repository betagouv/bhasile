import fs from "node:fs";
import path from "node:path";

import { REPORTING_QUALITY_INDICATOR_FIELDS } from "scripts/recurring-scripts/reporting-indicator-categories";
import { describe, expect, it } from "vitest";

import { COLONNES_REPORTING_QUALITE } from "@/lib/anomalies/anomalie.reporting";
import { AnomalieCode } from "@/types/anomalie.type";

const vue = fs.readFileSync(
  path.join(process.cwd(), "scripts/views/004z_structures_global_quality.sql"),
  "utf8"
);

describe("correspondance registre / vue de reporting", () => {
  it("rattache chaque code du registre à une colonne historique", () => {
    const codesMappes = Object.values(COLONNES_REPORTING_QUALITE).flat();

    expect([...codesMappes].sort()).toEqual([...AnomalieCode].sort());
  });

  it("couvre exactement les colonnes attendues par le reporting mensuel", () => {
    expect(Object.keys(COLONNES_REPORTING_QUALITE).sort()).toEqual(
      [...REPORTING_QUALITY_INDICATOR_FIELDS].sort()
    );
  });

  it("expose chaque colonne dans la vue 004z", () => {
    for (const colonne of Object.keys(COLONNES_REPORTING_QUALITE)) {
      expect(vue).toContain(`"${colonne}"`);
    }
  });

  it("référence chaque code du registre dans la vue 004z", () => {
    for (const code of AnomalieCode) {
      expect(vue).toContain(`'${code}'`);
    }
  });
});
