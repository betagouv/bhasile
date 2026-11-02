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
import { computeTarificationState } from "@/lib/tarification/tarification.compute";
import {
  computeStepProgress,
  getDefaultSectionCode,
  getSectionLabel,
  getSectionVersions,
  parseSectionCode,
} from "@/lib/tarification/tarification.section";
import { filterJournalForOperateur } from "@/lib/tarification/tarification.visibility";
import type {
  TarificationJournal,
  TarificationJournalRead,
} from "@/types/tarification.type";

const AT = "2028-04-10T10:00:00Z";

const toRead = (journal: TarificationJournal): TarificationJournalRead => ({
  ...journal,
  documents: journal.documents.map((document) => ({
    ...document,
    fileUpload: {
      key: `doc-${document.id}.pdf`,
      originalName: `doc-${document.id}.pdf`,
      mimeType: "application/pdf",
      fileSize: 10,
      sha256: null,
    },
  })),
  events: journal.events.map((event) => ({
    ...event,
    author: event.authorId ? { name: `Auteur ${event.authorId}` } : null,
  })),
  openings: journal.openings.map((opening) => ({
    ...opening,
    user: { name: "Opérateur" },
  })),
});

const depositDraft = (journal: TarificationJournal, authorId = 20): number =>
  depositDocument(journal, {
    types: ["RCA"],
    at: AT,
    status: TarificationDocumentStatus.DRAFT,
    authorId,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });

const review = (
  journal: TarificationJournal,
  documentId: number,
  type: "APPROVED" | "CHANGES_REQUESTED",
  authorId = 21
) =>
  addEvent(journal, {
    type,
    documentId,
    authorId,
    authorLevel: AuthorLevel.REGION,
    text: type === "CHANGES_REQUESTED" ? "Corriger le montant" : null,
    createdAt: new Date(AT),
  });

describe("getSectionLabel", () => {
  it("donne l'exercice des documents préliminaires", () => {
    expect(getSectionLabel("CA", 2028)).toBe("CA et rapport d'activité 2026");
    expect(getSectionLabel("BP", 2028)).toBe("BP et rapport budgétaire 2028");
    expect(getSectionLabel("DAI", 2028)).toBe(
      "DAI 2028 (issue de l'arrêté 2027)"
    );
  });

  it("nomme la quatrième étape Arrêté et tarification", () => {
    expect(getSectionLabel("ARRETE", 2028)).toBe("Arrêté et tarification");
  });
});

describe("parseSectionCode", () => {
  it("reconnaît une section, et rejette le reste", () => {
    expect(parseSectionCode("L48")).toBe("L48");
    expect(parseSectionCode("INCONNUE")).toBeNull();
    expect(parseSectionCode("toString")).toBeNull();
    expect(parseSectionCode(undefined)).toBeNull();
  });
});

describe("getDefaultSectionCode", () => {
  it("choisit l'étape attendue, puis la première à venir", () => {
    const expectedJournal = createJournal();
    depositDocument(expectedJournal, { types: ["CA"], at: AT });
    expect(
      getDefaultSectionCode(
        computeTarificationState(expectedJournal, new Date(AT))
      )
    ).toBe("RCA");

    expect(
      getDefaultSectionCode(
        computeTarificationState(createJournal(), new Date(AT))
      )
    ).toBe("RCA");
  });

  it("revient à la première étape quand tout est fait", () => {
    const journal = createJournal();
    for (const types of [["RCA"], ["L48"], ["DAB"], ["ARRETE"]] as const) {
      shareAgentDocument(journal, { types: [...types], at: AT });
    }

    expect(
      getDefaultSectionCode(computeTarificationState(journal, new Date(AT)))
    ).toBe("RCA");
  });
});

describe("getSectionVersions", () => {
  it("regroupe les types de la section, du plus récent au plus ancien, avec leur exercice", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: AT });
    depositDocument(journal, { types: ["BP"], at: AT });
    depositDocument(journal, { types: ["RAPPORT_ACTIVITE"], at: AT });

    expect(
      getSectionVersions(toRead(journal), "CA").map((version) => [
        version.id,
        version.typesLabel,
      ])
    ).toEqual([
      [3, "Rapport d'activité 2026"],
      [1, "Compte administratif 2026"],
    ]);
  });

  it("nomme l'état sans jamais dire brouillon", () => {
    const getState = (journal: TarificationJournal) =>
      getSectionVersions(toRead(journal), "RCA")[0].stateLabel;

    const created = createJournal();
    depositDraft(created);
    expect(getState(created)).toBe("Créé");

    const validated = createJournal();
    review(validated, depositDraft(validated), "APPROVED");
    expect(getState(validated)).toBe("Validé");

    const changes = createJournal();
    review(changes, depositDraft(changes), "CHANGES_REQUESTED");
    expect(getState(changes)).toBe("Modifications demandées");

    const signed = createJournal();
    depositDocument(signed, {
      types: ["RCA"],
      at: AT,
      status: TarificationDocumentStatus.FINAL,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });
    expect(getState(signed)).toBe("Signé");

    const sent = createJournal();
    shareAgentDocument(sent, { types: ["RCA"], at: AT });
    expect(getState(sent)).toBe("Envoyé");

    const deposited = createJournal();
    depositDocument(deposited, { types: ["RCA"], at: AT });
    expect(getState(deposited)).toBe("Déposé");
  });

  it("donne le motif d'un retrait et celui d'une demande de modifications", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, {
      types: ["RCA"],
      at: AT,
    });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      text: "Erreur de structure",
      createdAt: new Date(AT),
    });
    const [withdrawn] = getSectionVersions(toRead(journal), "RCA");
    expect(withdrawn).toMatchObject({
      isWithdrawn: true,
      stateLabel: "Retiré",
      withdrawalReason: "Erreur de structure",
    });

    const reviewed = createJournal();
    review(reviewed, depositDraft(reviewed), "CHANGES_REQUESTED");
    expect(getSectionVersions(toRead(reviewed), "RCA")[0]).toMatchObject({
      reviewRequestText: "Corriger le montant",
    });
  });

  it("oublie une demande de modifications dès qu'une relecture la suit", () => {
    const journal = createJournal();
    const documentId = depositDraft(journal);
    review(journal, documentId, "CHANGES_REQUESTED");
    review(journal, documentId, "APPROVED", 22);

    expect(getSectionVersions(toRead(journal), "RCA")[0]).toMatchObject({
      stateLabel: "Validé",
      reviewRequestText: null,
    });
  });

  it("date une version des agents à son partage pour l'opérateur, jamais à sa rédaction", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, {
      types: ["L48"],
      at: "2028-04-01T10:00:00Z",
      status: TarificationDocumentStatus.FINAL,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_SHARED,
      documentId,
      createdAt: new Date("2028-04-10T10:00:00Z"),
    });

    const [agentVersion] = getSectionVersions(toRead(journal), "L48");
    const [operateurVersion] = getSectionVersions(
      filterJournalForOperateur(toRead(journal)),
      "L48"
    );

    expect(agentVersion.date).toEqual(new Date("2028-04-01T10:00:00Z"));
    expect(operateurVersion.date).toEqual(new Date("2028-04-10T10:00:00Z"));
  });
});

describe("computeStepProgress", () => {
  it("part de rien pour une étape sans document", () => {
    expect(
      computeStepProgress(toRead(createJournal()), TarificationStepCode.RCA)
    ).toEqual({
      creators: [],
      reviewers: [],
      hasChangesRequested: false,
      isValidated: false,
      isSigned: false,
      isSent: false,
      isReceived: false,
    });
  });

  it("suit la création, la relecture et la validation, dès la première relecture", () => {
    const journal = createJournal();
    const documentId = depositDraft(journal);
    review(journal, documentId, "APPROVED", 21);
    review(journal, documentId, "APPROVED", 22);
    review(journal, documentId, "APPROVED", 22);

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.RCA)
    ).toMatchObject({
      creators: [{ name: "Auteur 20", level: "DEPARTEMENT" }],
      reviewers: [
        { name: "Auteur 21", level: "REGION" },
        { name: "Auteur 22", level: "REGION" },
      ],
      isValidated: true,
      isSigned: false,
    });
  });

  it("signale une demande de modifications, si elle est la dernière relecture", () => {
    const journal = createJournal();
    const documentId = depositDraft(journal);
    review(journal, documentId, "APPROVED");
    review(journal, documentId, "CHANGES_REQUESTED");

    const progress = computeStepProgress(
      toRead(journal),
      TarificationStepCode.RCA
    );
    expect(progress.hasChangesRequested).toBe(true);

    review(journal, documentId, "APPROVED");

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.RCA)
        .hasChangesRequested
    ).toBe(false);
  });

  it("suit la signature, l'envoi et la réception", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: AT,
    });

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.L48)
    ).toMatchObject({ isSigned: true, isSent: true, isReceived: false });

    openDocument(journal, documentId, AT);

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.L48).isReceived
    ).toBe(true);
  });

  it("ne compte ni un document retiré, ni la réponse de l'opérateur", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: AT,
    });
    addEvent(journal, {
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      text: "Erreur",
      createdAt: new Date(AT),
    });
    depositDocument(journal, {
      types: ["REPONSE_CONTRADICTOIRE"],
      at: AT,
    });

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.L48)
    ).toMatchObject({ creators: [], isSent: false });
  });

  it("regroupe la DAM et l'échéancier dans la quatrième étape", () => {
    const journal = createJournal();
    shareAgentDocument(journal, { types: ["ECHEANCIER"], at: AT });

    expect(
      computeStepProgress(toRead(journal), TarificationStepCode.ARRETE).isSent
    ).toBe(true);
  });

  it("n'expose à l'opérateur ni les auteurs ni les relecteurs d'une version des agents", () => {
    const journal = createJournal();
    const draftId = depositDocument(journal, {
      types: ["L48"],
      at: AT,
      status: TarificationDocumentStatus.DRAFT,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });
    review(journal, draftId, "APPROVED");
    shareAgentDocument(journal, { types: ["L48"], at: AT });

    expect(
      computeStepProgress(
        filterJournalForOperateur(toRead(journal)),
        TarificationStepCode.L48
      )
    ).toMatchObject({
      creators: [],
      reviewers: [],
      isValidated: false,
      isSent: true,
    });
  });
});
