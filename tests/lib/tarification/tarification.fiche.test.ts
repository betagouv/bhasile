import {
  addEvent,
  createJournal,
  depositDocument,
  shareAgentDocument,
} from "tests/test-utils/factories/tarification-journal.factory";
import { describe, expect, it } from "vitest";

import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import {
  computeFicheCopies,
  computeFicheCopyChanges,
  getDeletableFicheCopies,
} from "@/lib/tarification/tarification.fiche";

describe("computeFicheCopies", () => {
  it("copie un dépôt de l'opérateur sur l'exercice de son type", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, {
      types: ["CA"],
      at: "2027-04-10T10:00:00Z",
    });

    expect(computeFicheCopies(journal)).toEqual([
      {
        documentId,
        target: "DOCUMENT_FINANCIER",
        category: "COMPTE_ADMINISTRATIF_SOUMIS",
        year: 2026,
      },
    ]);
  });

  it("ne copie un document des agents qu'à son partage", () => {
    const journal = createJournal();
    depositDocument(journal, {
      types: ["RCA"],
      at: "2028-04-10T10:00:00Z",
      status: TarificationDocumentStatus.FINAL,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });

    expect(computeFicheCopies(journal)).toEqual([]);

    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_SHARED,
      documentId: 1,
      createdAt: new Date("2028-04-11T10:00:00Z"),
    });

    expect(computeFicheCopies(journal)).toMatchObject([
      { category: "COMPTE_ADMINISTRATIF_RETENU" },
    ]);
  });

  it("donne une copie par type d'un document à plusieurs types", () => {
    const journal = createJournal();
    depositDocument(journal, {
      types: ["CA", "RAPPORT_ACTIVITE"],
      at: "2027-04-10T10:00:00Z",
    });

    expect(computeFicheCopies(journal).map((copy) => copy.category)).toEqual([
      "COMPTE_ADMINISTRATIF_SOUMIS",
      "RAPPORT_ACTIVITE",
    ]);
  });

  it("copie l'arrêté en acte administratif, et ignore la L48", () => {
    const journal = createJournal();
    shareAgentDocument(journal, { types: ["L48"], at: "2028-04-10T10:00:00Z" });
    shareAgentDocument(journal, {
      types: ["ARRETE"],
      at: "2028-06-10T10:00:00Z",
    });

    expect(computeFicheCopies(journal)).toMatchObject([
      {
        documentId: 2,
        target: "ACTE_ADMINISTRATIF",
        category: "ARRETE_TARIFICATION",
        year: 2028,
      },
    ]);
  });

  it("suit le dernier document du type, et revient au précédent après un retrait", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: "2027-04-10T10:00:00Z" });
    const lastDocumentId = depositDocument(journal, {
      types: ["CA"],
      at: "2027-04-12T10:00:00Z",
    });

    expect(computeFicheCopies(journal)).toMatchObject([
      { documentId: lastDocumentId },
    ]);

    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId: lastDocumentId,
      text: "Erreur",
      createdAt: new Date("2027-04-13T10:00:00Z"),
    });

    expect(computeFicheCopies(journal)).toMatchObject([{ documentId: 1 }]);
  });
});

describe("computeFicheCopyChanges", () => {
  const copy = {
    documentId: 1,
    target: "DOCUMENT_FINANCIER" as const,
    category: "COMPTE_ADMINISTRATIF_SOUMIS" as const,
    year: 2026,
  };
  const existingCopy = {
    id: 9,
    documentId: 1,
    target: "DOCUMENT_FINANCIER" as const,
    category: "COMPTE_ADMINISTRATIF_SOUMIS",
  };

  it("ne change rien quand la fiche est à jour", () => {
    expect(computeFicheCopyChanges([copy], [existingCopy])).toEqual({
      copiesToCreate: [],
      copiesToDelete: [],
    });
  });

  it("crée ce qui manque et supprime ce qui n'est plus voulu", () => {
    const newCopy = { ...copy, documentId: 2 };

    expect(computeFicheCopyChanges([newCopy], [existingCopy])).toEqual({
      copiesToCreate: [newCopy],
      copiesToDelete: [existingCopy],
    });
  });
});

describe("getDeletableFicheCopies", () => {
  const depositCa = (journal: ReturnType<typeof createJournal>) =>
    depositDocument(journal, { types: ["CA"], at: "2026-06-01T10:00:00Z" });

  const toExistingCopy = (documentId: number) => ({
    id: 9,
    documentId,
    target: "DOCUMENT_FINANCIER" as const,
    category: "COMPTE_ADMINISTRATIF_SOUMIS",
  });

  const toCopyWithoutFile = (documentId: number) => ({
    documentId,
    target: "DOCUMENT_FINANCIER" as const,
    category: "COMPTE_ADMINISTRATIF_SOUMIS" as const,
    year: 2026,
  });

  it("garde un document remplacé tant que la copie de son remplaçant manque", () => {
    const journal = createJournal();
    const replacedCopy = toExistingCopy(depositCa(journal));

    expect(
      getDeletableFicheCopies(journal, {
        copiesToDelete: [replacedCopy],
        copiesWithoutFile: [toCopyWithoutFile(depositCa(journal))],
      })
    ).toEqual([]);
  });

  it("supprime un document remplacé dès que la copie de son remplaçant existe", () => {
    const journal = createJournal();
    const replacedCopy = toExistingCopy(depositCa(journal));

    expect(
      getDeletableFicheCopies(journal, {
        copiesToDelete: [replacedCopy],
        copiesWithoutFile: [],
      })
    ).toEqual([replacedCopy]);
  });

  it("supprime un document retiré même si la copie suivante manque", () => {
    const journal = createJournal();
    const previousDocumentId = depositCa(journal);
    const withdrawnDocumentId = depositCa(journal);
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId: withdrawnDocumentId,
      text: "Erreur de structure",
      createdAt: new Date("2026-06-02T10:00:00Z"),
    });
    const withdrawnCopy = toExistingCopy(withdrawnDocumentId);

    expect(
      getDeletableFicheCopies(journal, {
        copiesToDelete: [withdrawnCopy],
        copiesWithoutFile: [toCopyWithoutFile(previousDocumentId)],
      })
    ).toEqual([withdrawnCopy]);
  });

  it("supprime une copie dont la catégorie n'a pas de remplaçant en échec", () => {
    const journal = createJournal();
    const replacedCopy = toExistingCopy(depositCa(journal));

    expect(
      getDeletableFicheCopies(journal, {
        copiesToDelete: [replacedCopy],
        copiesWithoutFile: [
          {
            documentId: depositCa(journal),
            target: "DOCUMENT_FINANCIER",
            category: "BUDGET_PREVISIONNEL_DEMANDE",
            year: 2027,
          },
        ],
      })
    ).toEqual([replacedCopy]);
  });
});
