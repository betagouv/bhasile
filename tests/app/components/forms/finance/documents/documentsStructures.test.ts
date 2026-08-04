import { describe, expect, it } from "vitest";

import {
  isDocumentStillRequired,
  StructureDocument,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { CURRENT_YEAR } from "@/constants";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";

const buildDocument = (
  yearIndex: number,
  required = true
): StructureDocument => ({
  label: "Document de test",
  value: "AUTRE_FINANCIER",
  yearIndex,
  required,
});

const buildCpomDocument = (year: number): DocumentFinancierApiType =>
  ({
    category: "AUTRE_FINANCIER",
    year,
  }) as DocumentFinancierApiType;

describe("isDocumentStillRequired", () => {
  it("exige un document d'indice 0 dès l'année en cours", () => {
    expect(isDocumentStillRequired(buildDocument(0), CURRENT_YEAR, [])).toBe(
      true
    );
  });

  it("n'exige pas encore un document d'indice 1 pour l'année en cours", () => {
    expect(isDocumentStillRequired(buildDocument(1), CURRENT_YEAR, [])).toBe(
      false
    );
  });

  it("exige un document d'indice 1 à partir de l'année précédente", () => {
    expect(isDocumentStillRequired(buildDocument(1), CURRENT_YEAR - 1, [])).toBe(
      true
    );
  });

  it("exige les documents des années révolues", () => {
    expect(isDocumentStillRequired(buildDocument(2), CURRENT_YEAR - 5, [])).toBe(
      true
    );
  });

  it("n'exige jamais un document optionnel, même sur une année révolue", () => {
    expect(
      isDocumentStillRequired(buildDocument(0, false), CURRENT_YEAR - 5, [])
    ).toBe(false);
  });

  it("n'exige plus un document porté par le CPOM pour cette année", () => {
    expect(
      isDocumentStillRequired(buildDocument(0), CURRENT_YEAR, [
        buildCpomDocument(CURRENT_YEAR),
      ])
    ).toBe(false);
  });

  it("exige toujours le document quand le CPOM ne porte qu'une autre année", () => {
    expect(
      isDocumentStillRequired(buildDocument(0), CURRENT_YEAR, [
        buildCpomDocument(CURRENT_YEAR - 1),
      ])
    ).toBe(true);
  });
});
