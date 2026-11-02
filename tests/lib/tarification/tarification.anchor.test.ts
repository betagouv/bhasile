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
  TarificationStepCode,
} from "@/generated/prisma/enums";
import { buildConversationAnchors } from "@/lib/tarification/tarification.anchor";
import { filterJournalForOperateur } from "@/lib/tarification/tarification.visibility";

const AT = "2028-04-10T10:00:00Z";
const LATER = "2028-04-12T10:00:00Z";

const getLabels = (journal: ReturnType<typeof createJournal>) =>
  buildConversationAnchors(journal).map(({ label }) => label);

describe("buildConversationAnchors", () => {
  it("nomme les faits du journal avec le document et son exercice", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, { types: ["CA"], at: AT });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      text: "Erreur de fichier",
      createdAt: new Date(LATER),
    });

    expect(getLabels(journal)).toEqual([
      `Dépôt : Compte administratif ${journal.campaignYear - 2}`,
      `Retrait : Compte administratif ${journal.campaignYear - 2}`,
    ]);
  });

  it("nomme l'étape d'un fait sans document, et rien de plus quand il n'y en a pas", () => {
    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
      stepCode: TarificationStepCode.RCA,
      text: "Pas de RCA",
      createdAt: new Date(AT),
    });
    addEvent(journal, {
      type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
      text: "Motif",
      createdAt: new Date(LATER),
    });

    expect(getLabels(journal)).toEqual([
      "Sans objet : RCA",
      "Déclarée hors Bhasile",
    ]);
  });

  it("ne répète pas le document joint à une réponse à la L48", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, {
      types: ["REPONSE_CONTRADICTOIRE"],
      at: AT,
    });
    addEvent(journal, {
      type: TarificationEventType.L48_CONTESTED,
      documentId,
      createdAt: new Date(LATER),
    });

    expect(getLabels(journal).at(-1)).toBe("L48 contestée");
  });

  it("trie les faits et les ouvertures par date", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    openDocument(journal, documentId, LATER);

    const labels = getLabels(journal);

    expect(labels.at(-1)).toBe(`Ouverture : L48 ${journal.campaignYear}`);
    const dates = buildConversationAnchors(journal).map(({ date }) =>
      date.getTime()
    );
    expect(dates).toEqual([...dates].sort((first, second) => first - second));
  });

  it("donne un identifiant distinct à chaque jalon", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    openDocument(journal, documentId, LATER);

    const ids = buildConversationAnchors(journal).map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ne révèle pas à l'opérateur le travail interne des agents", () => {
    const journal = createJournal();
    const draftId = depositDocument(journal, {
      types: ["L48"],
      at: AT,
      status: TarificationDocumentStatus.DRAFT,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });
    addEvent(journal, {
      type: TarificationEventType.APPROVED,
      documentId: draftId,
      createdAt: new Date(LATER),
    });

    expect(getLabels(journal)).toHaveLength(2);
    expect(
      buildConversationAnchors(filterJournalForOperateur(journal))
    ).toEqual([]);
  });
});
