import { createFinalisationDocumentsFinanciersValidStructure } from "tests/test-utils/structure.factory";
import { describe, expect, it } from "vitest";

import { StructureApiRead } from "@/schemas/api/structure.schema";
import {
  DocumentsFinanciersFlexibleSchema,
  DocumentsFinanciersSubmitSchema,
  getDocumentsFinanciersStrictSchema,
} from "@/schemas/forms/base/documentFinancier.schema";

const parseDocumentsFinanciers = (
  documentsFinanciers: StructureApiRead["documentsFinanciers"]
) => {
  const structure = createFinalisationDocumentsFinanciersValidStructure(1);
  return getDocumentsFinanciersStrictSchema(structure).safeParse({
    type: structure.type,
    creationDate: "02/01/2007",
    documentsFinanciers,
  });
};

describe("getDocumentsFinanciersStrictSchema", () => {
  it("accepte les documents requis quand chacun porte un fichier", () => {
    const { documentsFinanciers } =
      createFinalisationDocumentsFinanciersValidStructure(1);

    expect(parseDocumentsFinanciers(documentsFinanciers).success).toBe(true);
  });

  it("rejette un document requis dont le fichier a été supprimé", () => {
    const [firstDocument, ...otherDocuments] =
      createFinalisationDocumentsFinanciersValidStructure(
        1
      ).documentsFinanciers;

    const result = parseDocumentsFinanciers([
      { ...firstDocument, fileUploads: [] },
      ...otherDocuments,
    ]);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([
      "documentsFinanciers",
      firstDocument.year,
    ]);
  });
});

describe("DocumentsFinanciersSubmitSchema", () => {
  const autreDocument = (fileUploads: { key: string }[]) => ({
    documentsFinanciers: [
      { year: 2024, category: "AUTRE_FINANCIER", name: "Annexe", fileUploads },
    ],
  });

  it("rejette un autre document nommé sans fichier", () => {
    const result = DocumentsFinanciersSubmitSchema.safeParse(autreDocument([]));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([
      "documentsFinanciers",
      0,
      "fileUploads",
    ]);
  });

  it("accepte un autre document nommé avec son fichier", () => {
    expect(
      DocumentsFinanciersSubmitSchema.safeParse(
        autreDocument([{ key: "annexe" }])
      ).success
    ).toBe(true);
  });

  it("laisse passer un autre document sans fichier dans le schéma de sauvegarde automatique", () => {
    expect(
      DocumentsFinanciersFlexibleSchema.safeParse(autreDocument([])).success
    ).toBe(true);
  });
});
