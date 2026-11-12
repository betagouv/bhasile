import { beforeEach, describe, expect, it, vi } from "vitest";

import { editFaqItem, removeFaqItem } from "@/app/api/faq/faq.service";

const mockFindFaqItem = vi.fn();
const mockUpdateFaqItem = vi.fn();
const mockDeleteFaqItem = vi.fn();

vi.mock("@/app/api/faq/faq.repository", () => ({
  findFaqItem: (...args: unknown[]) => mockFindFaqItem(...args),
  updateFaqItem: (...args: unknown[]) => mockUpdateFaqItem(...args),
  deleteFaqItem: (...args: unknown[]) => mockDeleteFaqItem(...args),
}));

const faqItem = {
  question: "Comment déclarer une fermeture ?",
  contentMarkdown: "Depuis la fiche structure.",
  category: "Structures",
};

describe("faq.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFaqItem.mockResolvedValue({ id: 3 });
  });

  it("met à jour une question existante", async () => {
    await editFaqItem(3, faqItem);

    expect(mockUpdateFaqItem).toHaveBeenCalledWith(3, faqItem);
  });

  it("rejette la modification d'une question introuvable", async () => {
    mockFindFaqItem.mockResolvedValue(null);

    await expect(editFaqItem(3, faqItem)).rejects.toMatchObject({
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
});
