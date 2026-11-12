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
const mockSaveOfiiDnas = vi.fn();
const mockSaveOfiiActivites = vi.fn();

vi.mock("@/app/api/ofii-imports/ofii-xlsx.util", () => ({
  loadOfiiFile: (...args: unknown[]) => mockLoadOfiiFile(...args),
}));

vi.mock("@/app/api/ofii-imports/ofii-import.repository", () => ({
  findOfiiReferential: async () => createOfiiReferential(),
  saveOfiiDnas: (...args: unknown[]) => mockSaveOfiiDnas(...args),
  saveOfiiActivites: (...args: unknown[]) => mockSaveOfiiActivites(...args),
}));

const date = new Date("2025-10-31T12:00:00Z");
const file = { buffer: Buffer.from(""), fileName: "Liste 10.25.xlsx" };

describe("ofii-import.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadOfiiFile.mockReturnValue({ date, rows: [createOfiiRow()] });
    mockSaveOfiiDnas.mockResolvedValue({ count: 4 });
  });

  it("décrit le fichier et ses erreurs sans rien écrire", async () => {
    mockLoadOfiiFile.mockReturnValue({
      date,
      rows: [createOfiiRow(), createOfiiRow({ dnaCode: "C0302", nom: "" })],
    });

    expect(await previewOfiiImport(file)).toEqual({
      summary: "Octobre 2025 : 2 structures dans le fichier",
      details: "Les structures absentes du fichier seront marquées inactives.",
      errors: [{ key: "C0302", issues: ["nom OFII manquant"] }],
    });
    expect(mockSaveOfiiDnas).not.toHaveBeenCalled();
  });

  it("refuse d'importer un fichier qui contient des erreurs", async () => {
    mockLoadOfiiFile.mockReturnValue({
      date,
      rows: [createOfiiRow({ operateur: "INCONNU" })],
    });

    await expect(applyOfiiImport(file)).rejects.toMatchObject({ status: 400 });
    expect(mockSaveOfiiDnas).not.toHaveBeenCalled();
    expect(mockSaveOfiiActivites).not.toHaveBeenCalled();
  });

  it("refuse un fichier sans ligne, qui passerait toutes les structures en inactif", async () => {
    mockLoadOfiiFile.mockReturnValue({ date, rows: [] });

    await expect(applyOfiiImport(file)).rejects.toMatchObject({ status: 400 });
    expect(mockSaveOfiiDnas).not.toHaveBeenCalled();
  });

  it("écrit le référentiel puis l'activité d'un fichier valide", async () => {
    expect(await applyOfiiImport(file)).toEqual({
      summary:
        "1 structure importée pour octobre 2025, 4 structures passées inactives.",
    });
    expect(mockSaveOfiiDnas).toHaveBeenCalledWith(date, [
      expect.objectContaining({ code: "C0301", operateurId: 7 }),
    ]);
    expect(mockSaveOfiiActivites).toHaveBeenCalledWith(date, [
      expect.objectContaining({ dnaCode: "C0301", placesAutorisees: 80 }),
    ]);
  });
});
