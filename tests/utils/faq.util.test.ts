import { createFaqApiItem } from "tests/test-utils/factories/faq.factory";
import { describe, expect, it } from "vitest";

import { groupFaqItemsByCategory } from "@/utils/faq.util";

describe("groupFaqItemsByCategory", () => {
  it("regroupe les questions par catégorie, dans l'ordre alphabétique des catégories", () => {
    const fermeture = createFaqApiItem({ id: 1, category: "Structures" });
    const contact = createFaqApiItem({ id: 2, category: "Général" });
    const ouverture = createFaqApiItem({ id: 3, category: "Structures" });

    expect(groupFaqItemsByCategory([fermeture, contact, ouverture])).toEqual([
      { category: "Général", items: [contact] },
      { category: "Structures", items: [fermeture, ouverture] },
    ]);
  });

  it("renvoie une liste vide pour une FAQ vide", () => {
    expect(groupFaqItemsByCategory([])).toEqual([]);
  });
});
