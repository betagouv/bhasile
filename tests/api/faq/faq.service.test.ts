import { createFaqItemValues } from "tests/test-utils/factories/faq.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  editFaqItem,
  removeFaqItem,
  renameFaqCategory,
} from "@/app/api/faq/faq.service";

const mockFindFaqItem = vi.fn();
const mockUpdateFaqItem = vi.fn();
const mockDeleteFaqItem = vi.fn();
const mockUpdateFaqCategory = vi.fn();

vi.mock("@/app/api/faq/faq.repository", () => ({
  findFaqItem: (...args: unknown[]) => mockFindFaqItem(...args),
  updateFaqItem: (...args: unknown[]) => mockUpdateFaqItem(...args),
  deleteFaqItem: (...args: unknown[]) => mockDeleteFaqItem(...args),
  updateFaqCategory: (...args: unknown[]) => mockUpdateFaqCategory(...args),
}));

describe("faq.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFaqItem.mockResolvedValue({ id: 3 });
  });

  it("met à jour une question existante", async () => {
    await editFaqItem(3, createFaqItemValues());

    expect(mockUpdateFaqItem).toHaveBeenCalledWith(3, createFaqItemValues());
  });

  it("rejette la modification d'une question introuvable", async () => {
    mockFindFaqItem.mockResolvedValue(null);

    await expect(editFaqItem(3, createFaqItemValues())).rejects.toMatchObject({
      message: "Question introuvable",
      status: 404,
    });
    expect(mockUpdateFaqItem).not.toHaveBeenCalled();
  });

  it("rejette la suppression d'une question introuvable", async () => {
    mockFindFaqItem.mockResolvedValue(null);

    await expect(removeFaqItem(3)).rejects.toMatchObject({ status: 404 });
    expect(mockDeleteFaqItem).not.toHaveBeenCalled();
  });

  it("renomme toutes les questions de la catégorie", async () => {
    mockUpdateFaqCategory.mockResolvedValue({ count: 2 });

    await renameFaqCategory({ category: "Structures", newCategory: "Fiches" });

    expect(mockUpdateFaqCategory).toHaveBeenCalledWith("Structures", "Fiches");
  });

  it("rejette le renommage d'une catégorie introuvable", async () => {
    mockUpdateFaqCategory.mockResolvedValue({ count: 0 });

    await expect(
      renameFaqCategory({ category: "Inconnue", newCategory: "Fiches" })
    ).rejects.toMatchObject({ message: "Catégorie introuvable", status: 404 });
  });
});
