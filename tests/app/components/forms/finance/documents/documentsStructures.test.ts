import { describe, expect, it } from "vitest";

import {
  isDocumentOpenForYear,
  StructureDocument,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { CURRENT_YEAR } from "@/constants";

const buildDocument = (yearIndex: number): StructureDocument => ({
  label: "Document de test",
  value: "AUTRE_FINANCIER",
  yearIndex,
  required: true,
});

describe("isDocumentOpenForYear", () => {
  it("ouvre un document d'indice 0 pour l'année en cours", () => {
    expect(isDocumentOpenForYear(buildDocument(0), CURRENT_YEAR)).toBe(true);
  });

  it("ferme un document d'indice 1 pour l'année en cours", () => {
    expect(isDocumentOpenForYear(buildDocument(1), CURRENT_YEAR)).toBe(false);
  });

  it("ouvre un document d'indice 1 dès l'année précédente", () => {
    expect(isDocumentOpenForYear(buildDocument(1), CURRENT_YEAR - 1)).toBe(true);
  });

  it("ouvre tous les documents pour les années révolues", () => {
    expect(isDocumentOpenForYear(buildDocument(2), CURRENT_YEAR - 5)).toBe(true);
  });
});
