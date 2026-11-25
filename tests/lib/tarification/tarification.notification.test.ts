import {
  addEvent,
  AGENT_USER_ID,
  createJournal,
  depositDocument,
  openDocument,
  OPERATEUR_USER_ID,
  shareAgentDocument,
} from "tests/test-utils/factories/tarification-journal.factory";
import { describe, expect, it } from "vitest";

import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import {
  getReceivableEventTypes,
  isNotificationEvent,
  isNotificationRecipient,
  type RecipientProfile,
} from "@/lib/tarification/tarification.notification";
import type { TarificationJournal } from "@/types/tarification.type";

const AT = "2028-04-10T10:00:00Z";
const LATER = "2028-04-12T10:00:00Z";

const DDETS: RecipientProfile = {
  userId: 30,
  isDepartementEditor: true,
  isRegionEditor: false,
  isOperateur: false,
};
const DREETS: RecipientProfile = {
  userId: 40,
  isDepartementEditor: false,
  isRegionEditor: true,
  isOperateur: false,
};
const OPERATEUR: RecipientProfile = {
  userId: OPERATEUR_USER_ID,
  isDepartementEditor: false,
  isRegionEditor: false,
  isOperateur: true,
};

const getLastEvent = (journal: TarificationJournal) => journal.events.at(-1)!;

const isRecipient = (
  recipient: RecipientProfile,
  journal: TarificationJournal,
  readEventIds: number[] = []
): boolean =>
  isNotificationRecipient(
    recipient,
    getLastEvent(journal),
    journal,
    new Set(readEventIds)
  );

const withdraw = (journal: TarificationJournal, documentId: number): void => {
  addEvent(journal, {
    type: TarificationEventType.DOCUMENT_WITHDRAWN,
    documentId,
    text: "Erreur",
    createdAt: new Date(LATER),
  });
};

describe("isNotificationRecipient", () => {
  it("signale un dépôt de l'opérateur aux agents de la DDETS, pas à la DREETS", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: AT });

    expect(isRecipient(DDETS, journal)).toBe(true);
    expect(isRecipient(DREETS, journal)).toBe(false);
  });

  it("ne signale à personne une version déposée par un agent", () => {
    const journal = createJournal();
    depositDocument(journal, {
      types: ["L48"],
      at: AT,
      status: TarificationDocumentStatus.DRAFT,
      authorId: AGENT_USER_ID,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });

    expect(isRecipient(DDETS, journal)).toBe(false);
  });

  it("ne signale jamais un fait à son auteur", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: AT, authorId: DDETS.userId });

    expect(isRecipient(DDETS, journal)).toBe(false);
  });

  it("signale un partage à l'opérateur seulement", () => {
    const journal = createJournal();
    shareAgentDocument(journal, { types: ["L48"], at: AT });

    expect(isRecipient(OPERATEUR, journal)).toBe(true);
    expect(isRecipient(DDETS, journal)).toBe(false);
  });

  it("signale une relecture à l'auteur de la version, pas à ses collègues", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, {
      types: ["L48"],
      at: AT,
      status: TarificationDocumentStatus.DRAFT,
      authorId: DDETS.userId,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });
    addEvent(journal, {
      type: TarificationEventType.CHANGES_REQUESTED,
      documentId,
      authorId: 31,
      text: "À reprendre",
      createdAt: new Date(LATER),
    });

    expect(isRecipient(DDETS, journal)).toBe(true);
    expect(isRecipient({ ...DDETS, userId: 32 }, journal)).toBe(false);
  });

  it("signale une contestation de la L48 à la DDETS et à la DREETS", () => {
    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.L48_CONTESTED,
      authorId: OPERATEUR_USER_ID,
      authorLevel: AuthorLevel.OPERATEUR,
      createdAt: new Date(AT),
    });

    expect(isRecipient(DDETS, journal)).toBe(true);
    expect(isRecipient(DREETS, journal)).toBe(true);
  });

  it("ne signale pas une acceptation de la L48", () => {
    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.L48_ACCEPTED,
      authorId: OPERATEUR_USER_ID,
      authorLevel: AuthorLevel.OPERATEUR,
      createdAt: new Date(AT),
    });

    expect(isRecipient(DDETS, journal)).toBe(false);
  });

  it("signale un retrait à l'opérateur qui a ouvert le document", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    openDocument(journal, documentId, AT);
    withdraw(journal, documentId);

    expect(isRecipient(OPERATEUR, journal)).toBe(true);
  });

  it("signale un retrait à l'opérateur qui a traité la ligne du partage", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    const shareEventId = getLastEvent(journal).id;
    withdraw(journal, documentId);

    expect(isRecipient(OPERATEUR, journal, [shareEventId])).toBe(true);
  });

  it("ne signale pas le retrait d'un partage que l'opérateur n'a pas pu voir", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    withdraw(journal, documentId);

    expect(isRecipient(OPERATEUR, journal)).toBe(false);
  });
});

describe("isNotificationEvent", () => {
  it("retire de la cloche le partage d'un document retiré", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, { types: ["L48"], at: AT });
    const shareEvent = getLastEvent(journal);
    withdraw(journal, documentId);

    expect(isNotificationEvent(OPERATEUR, shareEvent, journal, new Set())).toBe(
      false
    );
  });
});

describe("getReceivableEventTypes", () => {
  it("borne chaque profil aux faits que le prédicat peut lui signaler", () => {
    expect(getReceivableEventTypes(DDETS)).toEqual([
      TarificationEventType.DOCUMENT_DEPOSITED,
      TarificationEventType.APPROVED,
      TarificationEventType.CHANGES_REQUESTED,
      TarificationEventType.L48_CONTESTED,
    ]);
    expect(getReceivableEventTypes(DREETS)).toEqual([
      TarificationEventType.APPROVED,
      TarificationEventType.CHANGES_REQUESTED,
      TarificationEventType.L48_CONTESTED,
    ]);
    expect(getReceivableEventTypes(OPERATEUR)).toEqual([
      TarificationEventType.DOCUMENT_SHARED,
      TarificationEventType.DOCUMENT_WITHDRAWN,
    ]);
  });
});
