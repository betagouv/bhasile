import { describe, expect, it } from "vitest";

import {
  isDocumentStillRequired,
  StructureDocument,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { DOCUMENTS_FINANCIERS_OPEN_YEAR } from "@/constants";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";

const buildDocument = (
  yearOffset: number,
  required = true
): StructureDocument => ({
  label: "Document de test",
  value: "AUTRE_FINANCIER",
  yearOffset,
  required,
});

const buildCpomDocument = (year: number): DocumentFinancierApiType =>
  ({
    category: "AUTRE_FINANCIER",
    year,
  }) as DocumentFinancierApiType;

describe("isDocumentStillRequired", () => {
  it("exige un document de décalage 0 dès l'année d'ouverture", () => {
    expect(
      isDocumentStillRequired(buildDocument(0), DOCUMENTS_FINANCIERS_OPEN_YEAR)
    ).toBe(true);
  });

  it("n'exige pas un document au-delà de l'année d'ouverture", () => {
    expect(
      isDocumentStillRequired(
        buildDocument(0),
        DOCUMENTS_FINANCIERS_OPEN_YEAR + 1
      )
    ).toBe(false);
  });

  it("n'exige pas encore un document de décalage 1 pour l'année d'ouverture", () => {
    expect(
      isDocumentStillRequired(buildDocument(1), DOCUMENTS_FINANCIERS_OPEN_YEAR)
    ).toBe(false);
  });

  it("exige un document de décalage 1 à partir de l'année précédant l'ouverture", () => {
    expect(
      isDocumentStillRequired(
        buildDocument(1),
        DOCUMENTS_FINANCIERS_OPEN_YEAR - 1
      )
    ).toBe(true);
  });

  it("exige les documents des années révolues", () => {
    expect(
      isDocumentStillRequired(
        buildDocument(2),
        DOCUMENTS_FINANCIERS_OPEN_YEAR - 5
      )
    ).toBe(true);
  });

  it("n'exige jamais un document optionnel, même sur une année révolue", () => {
    expect(
      isDocumentStillRequired(
        buildDocument(0, false),
        DOCUMENTS_FINANCIERS_OPEN_YEAR - 5
      )
    ).toBe(false);
  });

  it("n'exige plus un document porté par le CPOM pour cette année", () => {
    expect(
      isDocumentStillRequired(buildDocument(0), DOCUMENTS_FINANCIERS_OPEN_YEAR, [
        buildCpomDocument(DOCUMENTS_FINANCIERS_OPEN_YEAR),
      ])
    ).toBe(false);
  });

  it("exige toujours le document quand le CPOM ne porte qu'une autre année", () => {
    expect(
      isDocumentStillRequired(buildDocument(0), DOCUMENTS_FINANCIERS_OPEN_YEAR, [
        buildCpomDocument(DOCUMENTS_FINANCIERS_OPEN_YEAR - 1),
      ])
    ).toBe(true);
  });
});
