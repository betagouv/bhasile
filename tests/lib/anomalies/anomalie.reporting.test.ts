import fs from "node:fs";
import path from "node:path";

import { REPORTING_QUALITY_INDICATOR_FIELDS } from "scripts/recurring-scripts/reporting-indicator-categories";
import { describe, expect, it } from "vitest";

import { REPORTING_QUALITY_COLUMNS } from "@/lib/anomalies/anomalie.reporting";
import { AnomalieCode } from "@/types/anomalie.type";

const view = fs.readFileSync(
  path.join(process.cwd(), "scripts/views/004z_structures_global_quality.sql"),
  "utf8"
);

describe("correspondance registre / vue de reporting", () => {
  it("rattache chaque code du registre à une colonne historique", () => {
    const mappedCodes = Object.values(REPORTING_QUALITY_COLUMNS).flat();

    expect([...mappedCodes].sort()).toEqual([...AnomalieCode].sort());
  });

  it("couvre exactement les colonnes attendues par le reporting mensuel", () => {
    expect(Object.keys(REPORTING_QUALITY_COLUMNS).sort()).toEqual(
      [...REPORTING_QUALITY_INDICATOR_FIELDS].sort()
    );
  });

  it("expose chaque colonne dans la vue 004z", () => {
    for (const column of Object.keys(REPORTING_QUALITY_COLUMNS)) {
      expect(view).toContain(`"${column}"`);
    }
  });

  it("référence chaque code du registre dans la vue 004z", () => {
    for (const code of AnomalieCode) {
      expect(view).toContain(`'${code}'`);
    }
  });
});
