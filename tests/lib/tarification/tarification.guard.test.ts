import {
  addEvent,
  AGENT_USER_ID,
  createJournal,
  depositDocument,
  OPERATEUR_USER_ID,
  shareAgentDocument,
} from "tests/test-utils/factories/tarification-journal.factory";
import { describe, expect, it } from "vitest";

import {
  AuthorLevel,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import {
  assertCanDepositDocument,
  assertCanRecordEvent,
} from "@/lib/tarification/tarification.guard";
import type {
  CampaignPhase,
  TarificationJournal,
  TarificationJournalEvent,
} from "@/types/tarification.type";

const NOW = new Date("2028-04-15T12:00:00Z");
const OTHER_AGENT_ID = 21;

const deposit = (
  overrides: {
    journal?: TarificationJournal;
    authorLevel?: AuthorLevel;
    types?: TarificationDocumentType[];
    status?: TarificationDocumentStatus;
    phase?: CampaignPhase;
  } = {}
) =>
  assertCanDepositDocument({
    journal: createJournal(),
    authorLevel: AuthorLevel.OPERATEUR,
    types: ["CA"],
    status: TarificationDocumentStatus.SHARED,
    phase: "OPEN",
    now: NOW,
    ...overrides,
  });

const AGENT_AUTHOR = {
  authorId: OTHER_AGENT_ID,
  authorLevel: AuthorLevel.DEPARTEMENT,
};
const OPERATEUR_AUTHOR = {
  authorId: OPERATEUR_USER_ID,
  authorLevel: AuthorLevel.OPERATEUR,
};

const record = (
  journal: TarificationJournal,
  event: Partial<Omit<TarificationJournalEvent, "id" | "createdAt">> &
    Pick<TarificationJournalEvent, "type">,
  phase: CampaignPhase = "OPEN"
) =>
  assertCanRecordEvent({
    journal,
    event: {
      ...AGENT_AUTHOR,
      documentId: null,
      stepCode: null,
      text: null,
      ...event,
    },
    phase,
    now: NOW,
  });

const depositFinalDocument = (
  journal: TarificationJournal,
  types: TarificationDocumentType[]
): number =>
  depositDocument(journal, {
    types,
    at: "2028-04-10T10:00:00Z",
    status: TarificationDocumentStatus.FINAL,
    authorId: AGENT_USER_ID,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });

const depositDraft = (journal: TarificationJournal): number =>
  depositDocument(journal, {
    types: ["RCA"],
    at: "2028-04-10T10:00:00Z",
    status: TarificationDocumentStatus.DRAFT,
    authorId: AGENT_USER_ID,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });

const withdraw = (journal: TarificationJournal, documentId: number) =>
  addEvent(journal, {
    type: TarificationEventType.DOCUMENT_WITHDRAWN,
    documentId,
    text: "Erreur",
    createdAt: new Date("2028-04-11T10:00:00Z"),
  });

describe("assertCanDepositDocument", () => {
  it("accepte un dépôt de l'opérateur, partagé d'office", () => {
    expect(() => deposit()).not.toThrow();
  });

  it("refuse à l'opérateur un dépôt qui ne serait pas partagé", () => {
    expect(() => deposit({ status: TarificationDocumentStatus.DRAFT })).toThrow(
      "Cet état"
    );
  });

  it("refuse à l'opérateur un type réservé aux agents", () => {
    expect(() => deposit({ types: ["L48"] })).toThrow("déposé par les agents");
  });

  it("laisse un agent déposer pour l'opérateur, seulement partagé d'office", () => {
    const agent = { authorLevel: AuthorLevel.DEPARTEMENT };

    expect(() => deposit(agent)).not.toThrow();
    expect(() =>
      deposit({ ...agent, status: TarificationDocumentStatus.DRAFT })
    ).toThrow("Cet état");
  });

  it("dépose une version d'agent en travail ou signée, jamais partagée d'office", () => {
    const agent = {
      authorLevel: AuthorLevel.DEPARTEMENT,
      types: ["L48"] as TarificationDocumentType[],
    };

    expect(() =>
      deposit({ ...agent, status: TarificationDocumentStatus.DRAFT })
    ).not.toThrow();
    expect(() =>
      deposit({ ...agent, status: TarificationDocumentStatus.FINAL })
    ).not.toThrow();
    expect(() => deposit(agent)).toThrow("Cet état");
  });

  it("refuse un document qui mêle types de l'opérateur et types des agents", () => {
    expect(() =>
      deposit({
        authorLevel: AuthorLevel.DEPARTEMENT,
        types: ["CA", "L48"],
      })
    ).toThrow("ne mêle pas");
  });

  it("refuse à un agent de déposer la réponse au contradictoire", () => {
    const journal = createJournal();
    shareAgentDocument(journal, { types: ["L48"], at: "2028-04-10T10:00:00Z" });

    expect(() =>
      deposit({
        journal,
        authorLevel: AuthorLevel.DEPARTEMENT,
        types: ["REPONSE_CONTRADICTOIRE"],
      })
    ).toThrow("déposée par l'opérateur");
  });

  it("n'accepte une réponse au contradictoire que pendant celui-ci", () => {
    const journal = createJournal();
    const types: TarificationDocumentType[] = ["REPONSE_CONTRADICTOIRE"];

    expect(() => deposit({ journal, types })).toThrow("pas ouvert");

    shareAgentDocument(journal, { types: ["L48"], at: "2028-04-10T10:00:00Z" });

    expect(() => deposit({ journal, types })).not.toThrow();
  });

  it("ferme tout dépôt avant l'ouverture de la campagne", () => {
    expect(() => deposit({ phase: "UPCOMING" })).toThrow("pas ouvert");
  });

  it("ne garde en rattrapage que les dépôts d'agents des types de fin de campagne", () => {
    const agent = {
      phase: "CATCH_UP" as const,
      authorLevel: AuthorLevel.DEPARTEMENT,
      status: TarificationDocumentStatus.FINAL,
    };

    expect(() => deposit({ ...agent, types: ["ARRETE"] })).not.toThrow();
    expect(() => deposit({ ...agent, types: ["L48"] })).toThrow("pas ouvert");
    expect(() => deposit({ phase: "CATCH_UP" })).toThrow("pas ouvert");
  });
});

describe("assertCanRecordEvent", () => {
  it("refuse un fait mal formé, ou d'un auteur qui n'y a pas droit", () => {
    const journal = createJournal();

    expect(() =>
      record(journal, { type: TarificationEventType.OUT_OF_APP_DECLARED })
    ).toThrow("pas valide");
    expect(() =>
      record(journal, {
        type: TarificationEventType.OUT_OF_APP_DECLARED,
        text: "Courrier",
        ...OPERATEUR_AUTHOR,
      })
    ).toThrow("pas valide");
  });

  it("refuse un document d'une autre tarification", () => {
    expect(() =>
      record(createJournal(), {
        type: TarificationEventType.DOCUMENT_SHARED,
        documentId: 99,
      })
    ).toThrow("Document introuvable");
  });

  describe("partage", () => {
    const share = (
      journal: TarificationJournal,
      documentId: number,
      phase?: CampaignPhase
    ) =>
      record(
        journal,
        { type: TarificationEventType.DOCUMENT_SHARED, documentId },
        phase
      );

    it("partage une version signée, une seule fois", () => {
      const journal = createJournal();
      const documentId = depositFinalDocument(journal, ["RCA"]);

      expect(() => share(journal, documentId)).not.toThrow();

      addEvent(journal, {
        type: TarificationEventType.DOCUMENT_SHARED,
        documentId,
        createdAt: NOW,
      });

      expect(() => share(journal, documentId)).toThrow("déjà partagé");
    });

    it("refuse une version de travail ou un dépôt de l'opérateur", () => {
      const journal = createJournal();

      expect(() => share(journal, depositDraft(journal))).toThrow(
        "version signée"
      );
      expect(() =>
        share(
          journal,
          depositDocument(journal, {
            types: ["CA"],
            at: "2027-04-10T10:00:00Z",
          })
        )
      ).toThrow("version signée");
    });

    it("refuse une L48 sans BP déposé", () => {
      const journal = createJournal();
      const documentId = depositFinalDocument(journal, ["L48"]);

      expect(() => share(journal, documentId)).toThrow("Pas de L48 sans BP");

      depositDocument(journal, { types: ["BP"], at: "2027-10-10T10:00:00Z" });

      expect(() => share(journal, documentId)).not.toThrow();
    });

    it("refuse un BP retiré comme prérequis de la L48", () => {
      const journal = createJournal();
      const documentId = depositFinalDocument(journal, ["L48"]);
      const bpDocumentId = depositDocument(journal, {
        types: ["BP"],
        at: "2027-10-10T10:00:00Z",
      });
      withdraw(journal, bpDocumentId);

      expect(() => share(journal, documentId)).toThrow("Pas de L48 sans BP");
    });

    it("ferme le partage avant l'ouverture de la campagne, même d'un type de fin de campagne", () => {
      const journal = createJournal();

      expect(() =>
        share(journal, depositFinalDocument(journal, ["ARRETE"]), "UPCOMING")
      ).toThrow("pas ouvert");
    });

    it("ne garde en rattrapage que les types de fin de campagne", () => {
      const journal = createJournal();

      expect(() =>
        share(journal, depositFinalDocument(journal, ["ARRETE"]), "CATCH_UP")
      ).not.toThrow();
      expect(() =>
        share(journal, depositFinalDocument(journal, ["RCA"]), "CATCH_UP")
      ).toThrow("pas ouvert");
    });
  });

  describe("relecture", () => {
    const approve = (
      journal: TarificationJournal,
      documentId: number,
      authorId = OTHER_AGENT_ID
    ) =>
      record(journal, {
        type: TarificationEventType.APPROVED,
        documentId,
        authorId,
      });

    it("laisse un autre agent relire une version de travail", () => {
      const journal = createJournal();

      expect(() => approve(journal, depositDraft(journal))).not.toThrow();
    });

    it("refuse que l'auteur relise sa propre version", () => {
      const journal = createJournal();

      expect(() =>
        approve(journal, depositDraft(journal), AGENT_USER_ID)
      ).toThrow("ne la relit pas");
    });

    it("refuse de relire une version signée", () => {
      const journal = createJournal();

      expect(() =>
        approve(journal, depositFinalDocument(journal, ["RCA"]))
      ).toThrow("version de travail");
    });

    it("ferme la relecture en rattrapage", () => {
      const journal = createJournal();

      expect(() =>
        record(
          journal,
          {
            type: TarificationEventType.APPROVED,
            documentId: depositDraft(journal),
          },
          "CATCH_UP"
        )
      ).toThrow("pas ouvert");
    });
  });

  describe("retrait", () => {
    const recordWithdrawal = (
      journal: TarificationJournal,
      documentId: number,
      phase?: CampaignPhase
    ) =>
      record(
        journal,
        {
          type: TarificationEventType.DOCUMENT_WITHDRAWN,
          documentId,
          text: "Erreur de structure",
        },
        phase
      );

    it("retire un document partagé, une seule fois", () => {
      const journal = createJournal();
      const documentId = shareAgentDocument(journal, {
        types: ["L48"],
        at: "2028-04-10T10:00:00Z",
      });

      expect(() => recordWithdrawal(journal, documentId)).not.toThrow();

      withdraw(journal, documentId);

      expect(() => recordWithdrawal(journal, documentId)).toThrow(
        "déjà retiré"
      );
    });

    it("refuse de retirer un document jamais partagé", () => {
      const journal = createJournal();

      expect(() =>
        recordWithdrawal(journal, depositFinalDocument(journal, ["RCA"]))
      ).toThrow("partagé se retire");
    });

    it("laisse retirer en rattrapage un document de fin de campagne", () => {
      const journal = createJournal();
      const documentId = shareAgentDocument(journal, {
        types: ["ARRETE"],
        at: "2028-04-10T10:00:00Z",
      });

      expect(() =>
        recordWithdrawal(journal, documentId, "CATCH_UP")
      ).not.toThrow();
    });
  });

  describe("sans objet", () => {
    const markNotApplicable = (journal: TarificationJournal) =>
      record(journal, {
        type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
        stepCode: TarificationStepCode.RCA,
        text: "CA jamais reçu",
      });

    it("déclare sans objet une étape en attente, une seule fois", () => {
      const journal = createJournal();

      expect(() => markNotApplicable(journal)).not.toThrow();

      addEvent(journal, {
        type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
        stepCode: TarificationStepCode.RCA,
        text: "CA jamais reçu",
        createdAt: NOW,
      });

      expect(() => markNotApplicable(journal)).toThrow("plus en attente");
    });

    it("refuse une étape déjà faite", () => {
      const journal = createJournal();
      shareAgentDocument(journal, {
        types: ["RCA"],
        at: "2028-04-10T10:00:00Z",
      });

      expect(() => markNotApplicable(journal)).toThrow("plus en attente");
    });
  });

  describe("réponse au contradictoire", () => {
    const respond = (journal: TarificationJournal, documentId: number | null) =>
      record(journal, {
        type: TarificationEventType.L48_CONTESTED,
        documentId,
        ...OPERATEUR_AUTHOR,
      });

    const createJournalWithL48 = (at = "2028-04-10T10:00:00Z") => {
      const journal = createJournal();
      shareAgentDocument(journal, { types: ["L48"], at });
      return journal;
    };

    it("refuse une réponse sans L48 partagée", () => {
      expect(() => respond(createJournal(), null)).toThrow("pas ouvert");
    });

    it("accepte une réponse pendant le délai, même sans ouverture", () => {
      expect(() => respond(createJournalWithL48(), null)).not.toThrow();
    });

    it("refuse une réponse après l'échéance", () => {
      const journal = createJournalWithL48("2028-03-01T10:00:00Z");

      expect(() => respond(journal, null)).toThrow("pas ouvert");
    });

    it("n'accepte comme pièce qu'une réponse au contradictoire", () => {
      const journal = createJournalWithL48();
      const caDocumentId = depositDocument(journal, {
        types: ["CA"],
        at: "2027-04-10T10:00:00Z",
      });
      const responseDocumentId = depositDocument(journal, {
        types: ["REPONSE_CONTRADICTOIRE"],
        at: "2028-04-12T10:00:00Z",
      });

      expect(() => respond(journal, caDocumentId)).toThrow("pas une réponse");
      expect(() => respond(journal, responseDocumentId)).not.toThrow();
    });
  });

  it("déclare une tarification hors Bhasile une seule fois", () => {
    const journal = createJournal();
    const declare = () =>
      record(journal, {
        type: TarificationEventType.OUT_OF_APP_DECLARED,
        text: "Courrier",
      });

    expect(declare).not.toThrow();

    addEvent(journal, {
      type: TarificationEventType.OUT_OF_APP_DECLARED,
      text: "Courrier",
      createdAt: NOW,
    });

    expect(declare).toThrow("déjà hors Bhasile");
  });
});
