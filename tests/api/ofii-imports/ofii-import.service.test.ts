import {
  createOfiiReferential,
  createOfiiRow,
} from "tests/test-utils/factories/ofii.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyOfiiImport,
  previewOfiiImport,
} from "@/app/api/ofii-imports/ofii-import.service";

const mockLoadOfiiFile = vi.fn();
const mockSaveOfiiImport = vi.fn();

vi.mock("@/app/api/ofii-imports/ofii-xlsx.util", () => ({
  loadOfiiFile: (...args: unknown[]) => mockLoadOfiiFile(...args),
}));

vi.mock("@/app/api/ofii-imports/ofii-import.repository", () => ({
  findOfiiReferential: async () => createOfiiReferential(),
  findOfiiDnaChanges: async () => ({ existingDnas: [], deactivatedCount: 3 }),
  findLatestOfiiActiviteDate: async () => new Date("2025-09-30T12:00:00Z"),
  saveOfiiImport: (...args: unknown[]) => mockSaveOfiiImport(...args),
}));

const date = new Date("2025-10-31T12:00:00Z");
const file = {
  buffer: Buffer.from(""),
  fileName: "Liste 10.25.xlsx",
  month: null,
};

describe("ofii-import.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadOfiiFile.mockReturnValue({ date, rows: [createOfiiRow()] });
    mockSaveOfiiImport.mockResolvedValue(4);
  });

  it("décrit le fichier et ses erreurs sans rien écrire", async () => {
    mockLoadOfiiFile.mockReturnValue({
      date,
      rows: [createOfiiRow(), createOfiiRow({ dnaCode: "C0302", nom: "" })],
    });

    expect(await previewOfiiImport(file)).toEqual({
      summary: "2 structures dans le fichier",
      changes: [],
      detectedMonth: "2025-10",
      latestImportedMonth: "2025-09",
      errors: [{ key: "C0302", issues: ["nom OFII manquant"] }],
    });
    expect(mockSaveOfiiImport).not.toHaveBeenCalled();
  });

  it("simule les changements d'un fichier valide sans rien écrire", async () => {
    expect((await previewOfiiImport(file)).changes).toEqual([
      "1 nouvelle structure",
      "0 structure mise à jour",
      "3 structures absentes du fichier passées inactives",
      "Activité du mois enregistrée pour 1 structure",
    ]);
    expect(mockSaveOfiiImport).not.toHaveBeenCalled();
  });

  it("refuse d'importer un fichier qui contient des erreurs", async () => {
    mockLoadOfiiFile.mockReturnValue({
      date,
      rows: [createOfiiRow({ operateur: "INCONNU" })],
    });

    await expect(applyOfiiImport(file)).rejects.toMatchObject({ status: 400 });
    expect(mockSaveOfiiImport).not.toHaveBeenCalled();
  });

  it("refuse un fichier sans ligne, qui passerait toutes les structures en inactif", async () => {
    mockLoadOfiiFile.mockReturnValue({ date, rows: [] });

    await expect(applyOfiiImport(file)).rejects.toMatchObject({ status: 400 });
    expect(mockSaveOfiiImport).not.toHaveBeenCalled();
  });

  it("écrit le référentiel puis l'activité d'un fichier valide", async () => {
    expect(await applyOfiiImport(file)).toEqual({
      summary:
        "1 structure importée pour octobre 2025, 4 structures passées inactives.",
    });
    expect(mockSaveOfiiImport).toHaveBeenCalledWith(
      date,
      [expect.objectContaining({ code: "C0301", operateurId: 7 })],
      [expect.objectContaining({ dnaCode: "C0301", placesAutorisees: 80 })]
    );
  });

  it("écrit les données au mois confirmé, même s'il diffère du mois détecté", async () => {
    await applyOfiiImport({ ...file, month: "2025-09" });

    expect(mockSaveOfiiImport).toHaveBeenCalledWith(
      new Date("2025-09-30T12:00:00Z"),
      expect.any(Array),
      expect.any(Array)
    );
  });

  it("refuse d'importer sans mois, quand le fichier ne permet pas de le déduire", async () => {
    mockLoadOfiiFile.mockReturnValue({ date: null, rows: [createOfiiRow()] });

    await expect(applyOfiiImport(file)).rejects.toMatchObject({ status: 400 });
    expect(mockSaveOfiiImport).not.toHaveBeenCalled();
  });
});
