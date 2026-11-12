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
  });

  it.each([
    ["la modification", () => editFaqItem(3, createFaqItemValues())],
    ["la suppression", () => removeFaqItem(3)],
  ])("rejette %s d'une question introuvable", async (_, call) => {
    mockFindFaqItem.mockResolvedValue(null);

    await expect(call()).rejects.toMatchObject({
      message: "Question introuvable",
      status: 404,
    });
    expect(mockUpdateFaqItem).not.toHaveBeenCalled();
    expect(mockDeleteFaqItem).not.toHaveBeenCalled();
  });

  it("rejette le renommage d'une catégorie introuvable", async () => {
    mockUpdateFaqCategory.mockResolvedValue({ count: 0 });

    await expect(
      renameFaqCategory({ category: "Inconnue", newCategory: "Fiches" })
    ).rejects.toMatchObject({ message: "Catégorie introuvable", status: 404 });
  });
});
