import {
  addEvent,
  createJournal,
  depositDocument,
  openDocument,
  shareAgentDocument,
} from "tests/test-utils/factories/tarification-journal.factory";
import { describe, expect, it } from "vitest";

import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import {
  canOperateurOpenDocument,
  filterJournalForOperateur,
} from "@/lib/tarification/tarification.visibility";

const AT = "2028-04-10T10:00:00Z";

const createJournalWithAgentDraft = () => {
  const journal = createJournal();
  const draftDocumentId = depositDocument(journal, {
    types: ["L48"],
    at: AT,
    status: TarificationDocumentStatus.DRAFT,
    authorId: 20,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });
  addEvent(journal, {
    type: TarificationEventType.APPROVED,
    documentId: draftDocumentId,
    createdAt: new Date(AT),
  });
  return { journal, draftDocumentId };
};

describe("filterJournalForOperateur", () => {
  it("montre à l'opérateur ses dépôts et les documents partagés, pas les versions des agents", () => {
    const { journal, draftDocumentId } = createJournalWithAgentDraft();
    const caDocumentId = depositDocument(journal, { types: ["CA"], at: AT });
    const l48DocumentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: AT,
    });

    const visibleDocumentIds = filterJournalForOperateur(journal).documents.map(
      (document) => document.id
    );

    expect(visibleDocumentIds).toEqual([caDocumentId, l48DocumentId]);
    expect(visibleDocumentIds).not.toContain(draftDocumentId);
  });

  it("cache à l'opérateur le dépôt et la relecture d'une version des agents", () => {
    const { journal } = createJournalWithAgentDraft();

    expect(filterJournalForOperateur(journal).events).toEqual([]);
  });

  it("montre à l'opérateur le partage d'un document des agents, mais pas la date de sa rédaction", () => {
    const journal = createJournal();
    shareAgentDocument(journal, { types: ["L48"], at: AT });

    const visibleTypes = filterJournalForOperateur(journal).events.map(
      (event) => event.type
    );

    expect(visibleTypes).toEqual([TarificationEventType.DOCUMENT_SHARED]);
  });

  it("montre à l'opérateur le retrait d'un document qu'il avait reçu", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      text: "Erreur de structure",
      createdAt: new Date(AT),
    });

    expect(
      filterJournalForOperateur(journal).events.map((event) => event.type)
    ).toContain(TarificationEventType.DOCUMENT_WITHDRAWN);
  });

  it("ne montre à l'opérateur que les ouvertures des documents qu'il voit", () => {
    const { journal, draftDocumentId } = createJournalWithAgentDraft();
    const l48DocumentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: AT,
    });
    openDocument(journal, l48DocumentId, AT);
    openDocument(journal, draftDocumentId, AT);

    expect(
      filterJournalForOperateur(journal).openings.map(
        (opening) => opening.documentId
      )
    ).toEqual([l48DocumentId]);
  });
});

describe("canOperateurOpenDocument", () => {
  it("laisse l'opérateur ouvrir un document partagé, jamais une version des agents", () => {
    const { journal } = createJournalWithAgentDraft();
    shareAgentDocument(journal, { types: ["L48"], at: AT });
    const [draft, shared] = journal.documents;

    expect(canOperateurOpenDocument(journal, draft)).toBe(false);
    expect(canOperateurOpenDocument(journal, shared)).toBe(true);
  });

  it("empêche l'opérateur d'ouvrir un document retiré", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      text: "Erreur de structure",
      createdAt: new Date(AT),
    });

    expect(canOperateurOpenDocument(journal, journal.documents[0])).toBe(false);
  });
});
