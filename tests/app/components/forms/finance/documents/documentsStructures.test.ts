import { describe, expect, it } from "vitest";

import {
  isDocumentRequiredForYear,
  StructureDocument,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { CURRENT_YEAR } from "@/constants";

const buildDocument = (
  yearIndex: number,
  required = true
): StructureDocument => ({
  label: "Document de test",
  value: "AUTRE_FINANCIER",
  yearIndex,
  required,
});

describe("isDocumentRequiredForYear", () => {
  it("exige un document d'indice 0 dès l'année en cours", () => {
    expect(isDocumentRequiredForYear(buildDocument(0), CURRENT_YEAR)).toBe(true);
  });

  it("n'exige pas encore un document d'indice 1 pour l'année en cours", () => {
    expect(isDocumentRequiredForYear(buildDocument(1), CURRENT_YEAR)).toBe(
      false
    );
  });

  it("exige un document d'indice 1 à partir de l'année précédente", () => {
    expect(isDocumentRequiredForYear(buildDocument(1), CURRENT_YEAR - 1)).toBe(
      true
    );
  });

  it("exige les documents des années révolues", () => {
    expect(isDocumentRequiredForYear(buildDocument(2), CURRENT_YEAR - 5)).toBe(
      true
    );
  });

  it("n'exige jamais un document optionnel, même sur une année révolue", () => {
    expect(
      isDocumentRequiredForYear(buildDocument(0, false), CURRENT_YEAR - 5)
    ).toBe(false);
  });
});
