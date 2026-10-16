import { createFinalisationDocumentsFinanciersValidStructure } from "tests/test-utils/structure.factory";
import { describe, expect, it } from "vitest";

import { StructureApiRead } from "@/schemas/api/structure.schema";
import { getDocumentsFinanciersStrictSchema } from "@/schemas/forms/base/documentFinancier.schema";

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
