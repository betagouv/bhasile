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
  TarificationEventType,
} from "@/generated/prisma/enums";
import {
  type ActionContext,
  canDeclareOutOfBhasile,
  computeSectionActions,
} from "@/lib/tarification/tarification.actions";

const AT = "2028-04-10T10:00:00Z";
const OTHER_AGENT_ID = 21;

const buildContext = (
  overrides: Partial<ActionContext> = {}
): ActionContext => ({
  journal: createJournal(),
  author: { id: OTHER_AGENT_ID, level: AuthorLevel.DEPARTEMENT },
  phase: "OPEN",
  isEligible: true,
  now: new Date("2028-04-15T12:00:00Z"),
  ...overrides,
});

const operateur = { id: OPERATEUR_USER_ID, level: AuthorLevel.OPERATEUR };

const depositAgentVersion = (
  journal: ActionContext["journal"],
  status: TarificationDocumentStatus,
  types: ("RCA" | "L48")[] = ["RCA"]
) =>
  depositDocument(journal, {
    types,
    at: AT,
    status,
    authorId: AGENT_USER_ID,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });

const computeVersionActions = (context: ActionContext, documentId: number) =>
  computeSectionActions({
    context,
    sectionCode: "RCA",
    versionIds: [documentId],
  }).versionActions[documentId];

describe("computeSectionActions", () => {
  describe("dépôts", () => {
    it("propose à un agent le type de l'étape, en travail ou signé", () => {
      expect(
        computeSectionActions({
          context: buildContext(),
          sectionCode: "RCA",
          versionIds: [],
        }).depositOptions
      ).toEqual([
        { type: "RCA", label: "RCA 2026", statuses: ["FINAL", "DRAFT"] },
      ]);
    });

    it("regroupe arrêté, DAM, DAI et échéancier dans la quatrième étape", () => {
      expect(
        computeSectionActions({
          context: buildContext(),
          sectionCode: "ARRETE",
          versionIds: [],
        }).depositOptions.map(({ type }) => type)
      ).toEqual(["ARRETE", "DAM", "DAI", "ECHEANCIER"]);
    });

    it("laisse l'agent déposer le CA pour l'opérateur, partagé d'office", () => {
      expect(
        computeSectionActions({
          context: buildContext(),
          sectionCode: "CA",
          versionIds: [],
        }).depositOptions[0]
      ).toMatchObject({ type: "CA", statuses: ["SHARED"] });
    });

    it("ne propose à l'opérateur que ses dépôts, jamais une étape des agents", () => {
      const context = buildContext({ author: operateur });

      expect(
        computeSectionActions({
          context,
          sectionCode: "RCA",
          versionIds: [],
        }).depositOptions
      ).toEqual([]);
      expect(
        computeSectionActions({
          context,
          sectionCode: "BP",
          versionIds: [],
        }).depositOptions.map(({ type }) => type)
      ).toEqual(["BP", "RAPPORT_BUDGETAIRE"]);
    });

    it("ne propose pas la réponse au contradictoire en dépôt libre", () => {
      const journal = createJournal();
      shareAgentDocument(journal, { types: ["L48"], at: AT });

      expect(
        computeSectionActions({
          context: buildContext({ journal, author: operateur }),
          sectionCode: "L48",
          versionIds: [],
        }).depositOptions
      ).toEqual([]);
    });

    it("ne garde en rattrapage que les types de fin de campagne, pour les agents", () => {
      const context = buildContext({ phase: "CATCH_UP" });

      expect(
        computeSectionActions({
          context,
          sectionCode: "RCA",
          versionIds: [],
        }).depositOptions
      ).toEqual([]);
      expect(
        computeSectionActions({
          context,
          sectionCode: "ARRETE",
          versionIds: [],
        }).depositOptions
      ).toHaveLength(4);
      expect(
        computeSectionActions({
          context: { ...context, author: operateur },
          sectionCode: "ARRETE",
          versionIds: [],
        }).depositOptions
      ).toEqual([]);
    });
  });

  describe("selon l'état du document", () => {
    it("propose la relecture d'une version de travail, sauf à son auteur", () => {
      const journal = createJournal();
      const documentId = depositAgentVersion(
        journal,
        TarificationDocumentStatus.DRAFT
      );

      expect(
        computeVersionActions(buildContext({ journal }), documentId)
      ).toEqual({
        canApprove: true,
        canRequestChanges: true,
        canShare: false,
        canWithdraw: false,
      });
      expect(
        computeVersionActions(
          buildContext({
            journal,
            author: { id: AGENT_USER_ID, level: AuthorLevel.DEPARTEMENT },
          }),
          documentId
        )
      ).toMatchObject({ canApprove: false, canRequestChanges: false });
    });

    it("propose l'envoi d'une version signée, puis son retrait une fois envoyée", () => {
      const journal = createJournal();
      const documentId = depositAgentVersion(
        journal,
        TarificationDocumentStatus.FINAL
      );

      expect(
        computeVersionActions(buildContext({ journal }), documentId)
      ).toEqual({
        canApprove: false,
        canRequestChanges: false,
        canShare: true,
        canWithdraw: false,
      });

      addEvent(journal, {
        type: TarificationEventType.DOCUMENT_SHARED,
        documentId,
        createdAt: new Date(AT),
      });

      expect(
        computeVersionActions(buildContext({ journal }), documentId)
      ).toEqual({
        canApprove: false,
        canRequestChanges: false,
        canShare: false,
        canWithdraw: true,
      });
    });

    it("ne repropose pas la relecture à qui vient de relire, mais lui laisse demander des modifications", () => {
      const journal = createJournal();
      const documentId = depositAgentVersion(
        journal,
        TarificationDocumentStatus.DRAFT
      );
      addEvent(journal, {
        type: TarificationEventType.APPROVED,
        documentId,
        authorId: OTHER_AGENT_ID,
        createdAt: new Date(AT),
      });

      expect(
        computeVersionActions(buildContext({ journal }), documentId)
      ).toMatchObject({ canApprove: false, canRequestChanges: true });
    });

    it("ne propose pas d'envoyer une L48 sans BP", () => {
      const journal = createJournal();
      const documentId = depositAgentVersion(
        journal,
        TarificationDocumentStatus.FINAL,
        ["L48"]
      );

      expect(
        computeVersionActions(buildContext({ journal }), documentId).canShare
      ).toBe(false);
    });

    it("ne propose à l'opérateur ni relecture, ni envoi, ni retrait", () => {
      const journal = createJournal();
      const documentId = shareAgentDocument(journal, {
        types: ["RCA"],
        at: AT,
      });

      expect(
        computeVersionActions(
          buildContext({ journal, author: operateur }),
          documentId
        )
      ).toEqual({
        canApprove: false,
        canRequestChanges: false,
        canShare: false,
        canWithdraw: false,
      });
    });
  });

  it("propose « sans objet » sur une étape en attente, aux agents seulement", () => {
    const compute = (context: ActionContext) =>
      computeSectionActions({
        context,
        sectionCode: "RCA",
        versionIds: [],
      }).canMarkNotApplicable;

    expect(compute(buildContext())).toBe(true);
    expect(compute(buildContext({ author: operateur }))).toBe(false);

    const journal = createJournal();
    shareAgentDocument(journal, { types: ["RCA"], at: AT });
    expect(compute(buildContext({ journal }))).toBe(false);
  });

  it("ne propose pas « sans objet » sur un document préliminaire", () => {
    expect(
      computeSectionActions({
        context: buildContext(),
        sectionCode: "CA",
        versionIds: [],
      }).canMarkNotApplicable
    ).toBe(false);
  });

  it("propose la réponse à la L48 à l'opérateur, pendant le contradictoire", () => {
    const compute = (context: ActionContext) =>
      computeSectionActions({
        context,
        sectionCode: "L48",
        versionIds: [],
      }).canRespondToL48;
    const journal = createJournal();

    expect(compute(buildContext({ journal, author: operateur }))).toBe(false);

    shareAgentDocument(journal, { types: ["L48"], at: AT });

    expect(compute(buildContext({ journal, author: operateur }))).toBe(true);
    expect(compute(buildContext({ journal }))).toBe(false);
    expect(
      compute(
        buildContext({
          journal,
          author: operateur,
          now: new Date("2028-06-01T12:00:00Z"),
        })
      )
    ).toBe(false);
  });

  it("ne propose rien pour la DAI de la campagne précédente, ni sur une structure non éligible", () => {
    const empty = {
      depositOptions: [],
      canMarkNotApplicable: false,
      canRespondToL48: false,
      versionActions: {},
    };

    expect(
      computeSectionActions({
        context: buildContext(),
        sectionCode: "DAI",
        versionIds: [1],
      })
    ).toEqual(empty);
    expect(
      computeSectionActions({
        context: buildContext({ isEligible: false }),
        sectionCode: "RCA",
        versionIds: [1],
      })
    ).toEqual(empty);
  });
});

describe("canDeclareOutOfBhasile", () => {
  it("le réserve aux agents, une seule fois, sur une structure éligible", () => {
    expect(canDeclareOutOfBhasile(buildContext())).toBe(true);
    expect(canDeclareOutOfBhasile(buildContext({ author: operateur }))).toBe(
      false
    );
    expect(canDeclareOutOfBhasile(buildContext({ isEligible: false }))).toBe(
      false
    );

    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.OUT_OF_APP_DECLARED,
      text: "Courrier",
      createdAt: new Date(AT),
    });
    expect(canDeclareOutOfBhasile(buildContext({ journal }))).toBe(false);
  });
});
