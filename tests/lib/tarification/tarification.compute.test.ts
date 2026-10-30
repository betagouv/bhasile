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
import type { TarificationJournal } from "@/types/tarification.type";

const DRL = "2028-03-01";
const J48_LAST_DAY = "2028-04-18T12:00:00Z";
const AFTER_J48 = "2028-04-19T12:00:00Z";

const getStep = (
  journal: TarificationJournal,
  code: TarificationStepCode,
  now: string
) =>
  computeTarificationState(journal, new Date(now)).steps.find(
    (step) => step.code === code
  )!;

const getDeposit = (
  journal: TarificationJournal,
  type: "CA" | "BP",
  now: string
) =>
  computeTarificationState(journal, new Date(now)).deposits.find(
    (deposit) => deposit.type === type
  )!;

const getContradictoire = (journal: TarificationJournal, now: string) =>
  computeTarificationState(journal, new Date(now)).contradictoire;

const withdraw = (
  journal: TarificationJournal,
  documentId: number,
  at: string
) =>
  addEvent(journal, {
    type: TarificationEventType.DOCUMENT_WITHDRAWN,
    documentId,
    text: "Erreur de structure",
    createdAt: new Date(at),
  });

const respond = (
  journal: TarificationJournal,
  type: "L48_ACCEPTED" | "L48_CONTESTED",
  at: string
) =>
  addEvent(journal, {
    type,
    authorId: 10,
    authorLevel: AuthorLevel.OPERATEUR,
    createdAt: new Date(at),
  });

describe("computeTarificationState — dépôts", () => {
  it("date les échéances de dépôt du CA et du BP sur l'année précédant la campagne", () => {
    const journal = createJournal();

    expect(getDeposit(journal, "CA", "2027-01-15T12:00:00Z").deadline).toBe(
      "2027-04-30"
    );
    expect(getDeposit(journal, "BP", "2027-01-15T12:00:00Z").deadline).toBe(
      "2027-10-31"
    );
  });

  it("ne met en retard un CA absent qu'après son échéance", () => {
    const journal = createJournal();

    expect(getDeposit(journal, "CA", "2027-04-30T21:00:00Z").isLate).toBe(
      false
    );
    expect(getDeposit(journal, "CA", "2027-04-30T22:00:00Z").isLate).toBe(true);
  });

  it("met en retard un CA déposé après son échéance, à l'heure de Paris", () => {
    const onTime = createJournal();
    depositDocument(onTime, { types: ["CA"], at: "2027-04-30T21:30:00Z" });
    const late = createJournal();
    depositDocument(late, { types: ["CA"], at: "2027-04-30T22:30:00Z" });

    expect(getDeposit(onTime, "CA", "2027-06-01T12:00:00Z").isLate).toBe(false);
    expect(getDeposit(late, "CA", "2027-06-01T12:00:00Z").isLate).toBe(true);
  });

  it("compte l'échéance à l'heure du département de la structure", () => {
    const reunion = createJournal({ timeZone: "Indian/Reunion" });
    depositDocument(reunion, { types: ["CA"], at: "2027-04-30T21:30:00Z" });
    const guadeloupe = createJournal({ timeZone: "America/Guadeloupe" });
    depositDocument(guadeloupe, { types: ["CA"], at: "2027-05-01T03:30:00Z" });

    expect(getDeposit(reunion, "CA", "2027-06-01T12:00:00Z").isLate).toBe(true);
    expect(getDeposit(guadeloupe, "CA", "2027-06-01T12:00:00Z").isLate).toBe(
      false
    );
  });

  it("retient le premier dépôt, même si une version suit", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["BP"], at: "2027-10-20T10:00:00Z" });
    depositDocument(journal, { types: ["BP"], at: "2027-11-15T10:00:00Z" });

    const deposit = getDeposit(journal, "BP", "2027-12-01T12:00:00Z");

    expect(deposit.depositedAt).toEqual(new Date("2027-10-20T10:00:00Z"));
    expect(deposit.isLate).toBe(false);
  });

  it("ne met jamais en retard un dépôt repris par le script d'amorçage", () => {
    const journal = createJournal();
    depositDocument(journal, {
      types: ["CA"],
      at: "2027-06-01T10:00:00Z",
      authorId: null,
      authorLevel: null,
    });

    expect(getDeposit(journal, "CA", "2027-06-02T12:00:00Z").isLate).toBe(
      false
    );
  });

  it("ignore un dépôt retiré", () => {
    const journal = createJournal();
    const documentId = depositDocument(journal, {
      types: ["CA"],
      at: "2027-04-01T10:00:00Z",
    });
    withdraw(journal, documentId, "2027-04-02T10:00:00Z");

    expect(
      getDeposit(journal, "CA", "2027-05-01T12:00:00Z").depositedAt
    ).toBeNull();
  });

  it("ne met jamais en retard une structure sous CPOM ni une tarification hors Bhasile", () => {
    const underCpom = createJournal({ isCoveredByCpom: true });
    const outOfBhasile = createJournal();
    addEvent(outOfBhasile, {
      type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
      text: "Opérateur suivi hors de l'outil",
      createdAt: new Date("2027-02-01T10:00:00Z"),
    });

    expect(getDeposit(underCpom, "CA", "2027-06-01T12:00:00Z").isLate).toBe(
      false
    );
    expect(
      computeTarificationState(outOfBhasile, new Date("2027-06-01T12:00:00Z"))
    ).toMatchObject({ isOutOfBhasile: true });
    expect(getDeposit(outOfBhasile, "CA", "2027-06-01T12:00:00Z").isLate).toBe(
      false
    );
  });
});

describe("computeTarificationState — étapes", () => {
  it("attend le CA avant d'ouvrir le RCA", () => {
    const journal = createJournal();

    expect(getStep(journal, "RCA", "2027-03-01T12:00:00Z").status).toBe(
      "UPCOMING"
    );

    depositDocument(journal, { types: ["CA"], at: "2027-04-01T10:00:00Z" });

    expect(getStep(journal, "RCA", "2027-04-02T12:00:00Z").status).toBe(
      "EXPECTED"
    );
  });

  it("fait une étape au partage de son document, pas à son dépôt", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: "2027-04-01T10:00:00Z" });
    depositDocument(journal, {
      types: ["RCA"],
      at: "2027-12-01T10:00:00Z",
      status: TarificationDocumentStatus.FINAL,
      authorId: 20,
      authorLevel: AuthorLevel.DEPARTEMENT,
    });

    expect(getStep(journal, "RCA", "2027-12-02T12:00:00Z").status).toBe(
      "EXPECTED"
    );

    shareAgentDocument(journal, { types: ["RCA"], at: "2027-12-03T10:00:00Z" });

    expect(getStep(journal, "RCA", "2027-12-04T12:00:00Z").status).toBe("DONE");
  });

  it("défait une étape quand son seul document est retiré", () => {
    const journal = createJournal();
    const documentId = shareAgentDocument(journal, {
      types: ["RCA"],
      at: "2027-12-03T10:00:00Z",
    });
    withdraw(journal, documentId, "2027-12-04T10:00:00Z");

    expect(getStep(journal, "RCA", "2027-12-05T12:00:00Z").status).not.toBe(
      "DONE"
    );
  });

  it("fait toutes les étapes des types d'un document à plusieurs types", () => {
    const journal = createJournal();
    shareAgentDocument(journal, {
      types: ["L48", "RCA"],
      at: "2028-04-01T10:00:00Z",
    });

    expect(getStep(journal, "RCA", "2028-04-02T12:00:00Z").status).toBe("DONE");
    expect(getStep(journal, "L48", "2028-04-02T12:00:00Z").status).toBe("DONE");
  });

  it("fait passer une étape faite avant une étape déclarée sans objet", () => {
    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
      stepCode: TarificationStepCode.RCA,
      text: "CA jamais reçu",
      createdAt: new Date("2027-12-01T10:00:00Z"),
    });

    expect(getStep(journal, "RCA", "2027-12-02T12:00:00Z").status).toBe(
      "NOT_APPLICABLE"
    );

    shareAgentDocument(journal, { types: ["RCA"], at: "2028-01-10T10:00:00Z" });

    expect(getStep(journal, "RCA", "2028-01-11T12:00:00Z").status).toBe("DONE");
  });

  it("n'ouvre la L48 qu'avec le RCA terminé et le BP déposé", () => {
    const journal = createJournal();
    addEvent(journal, {
      type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
      stepCode: TarificationStepCode.RCA,
      text: "RCA intégré à la L48",
      createdAt: new Date("2027-12-01T10:00:00Z"),
    });

    expect(getStep(journal, "L48", "2027-12-02T12:00:00Z").status).toBe(
      "UPCOMING"
    );

    depositDocument(journal, { types: ["BP"], at: "2027-10-20T10:00:00Z" });

    expect(getStep(journal, "L48", "2027-12-02T12:00:00Z").status).toBe(
      "EXPECTED"
    );
  });

  it("n'attend qu'une étape à la fois", () => {
    const journal = createJournal();
    depositDocument(journal, { types: ["CA"], at: "2027-04-01T10:00:00Z" });
    depositDocument(journal, { types: ["BP"], at: "2027-10-20T10:00:00Z" });

    const statuses = computeTarificationState(
      journal,
      new Date("2027-11-01T12:00:00Z")
    ).steps.map((step) => step.status);

    expect(statuses).toEqual(["EXPECTED", "UPCOMING", "UPCOMING", "UPCOMING"]);
  });

  it("calcule J48 et J60 depuis la DRL, sans échéance pour l'arrêté", () => {
    const journal = createJournal({ drlPublishedAt: DRL });
    const now = "2028-03-02T12:00:00Z";

    expect(getStep(journal, "RCA", now).deadline).toBe("2028-04-18");
    expect(getStep(journal, "L48", now).deadline).toBe("2028-04-18");
    expect(getStep(journal, "DAB", now).deadline).toBe("2028-04-30");
    expect(getStep(journal, "ARRETE", now).deadline).toBeNull();
  });

  it("met en retard une étape en attente le lendemain de son échéance", () => {
    const journal = createJournal({ drlPublishedAt: DRL });

    expect(getStep(journal, "L48", J48_LAST_DAY).isLate).toBe(false);
    expect(getStep(journal, "L48", AFTER_J48).isLate).toBe(true);
  });

  it("ne met aucune étape en retard tant que la DRL n'est pas saisie", () => {
    const journal = createJournal();

    expect(getStep(journal, "L48", "2028-12-01T12:00:00Z")).toMatchObject({
      deadline: null,
      isLate: false,
    });
  });

  it("ne met pas en retard une étape faite après son échéance", () => {
    const journal = createJournal({ drlPublishedAt: DRL });
    shareAgentDocument(journal, { types: ["L48"], at: AFTER_J48 });

    expect(getStep(journal, "L48", "2028-05-01T12:00:00Z").isLate).toBe(false);
  });
});

describe("computeTarificationState — contradictoire", () => {
  const SHARED_AT = "2028-04-10T10:00:00Z";

  const createJournalWithL48 = (): {
    journal: TarificationJournal;
    l48DocumentId: number;
  } => {
    const journal = createJournal({ drlPublishedAt: DRL });
    const l48DocumentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: SHARED_AT,
    });
    return { journal, l48DocumentId };
  };

  it("ne démarre pas sans L48 partagée", () => {
    expect(
      getContradictoire(createJournal(), "2028-04-11T12:00:00Z").status
    ).toBe("NOT_STARTED");
  });

  it("attend l'ouverture de la L48 avant de fixer l'échéance", () => {
    const { journal } = createJournalWithL48();

    expect(getContradictoire(journal, "2028-04-12T12:00:00Z")).toMatchObject({
      status: "WAITING_OPENING",
      deadline: null,
    });
  });

  it("fixe l'échéance 8 jours après la première ouverture", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    openDocument(journal, l48DocumentId, "2028-04-12T09:00:00Z");
    openDocument(journal, l48DocumentId, "2028-04-14T09:00:00Z");

    expect(getContradictoire(journal, "2028-04-13T12:00:00Z")).toMatchObject({
      status: "RUNNING",
      deadline: "2028-04-20",
      isClosed: false,
    });
  });

  it("répute acceptée une L48 sans réponse le lendemain de l'échéance", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    openDocument(journal, l48DocumentId, "2028-04-12T09:00:00Z");

    expect(getContradictoire(journal, "2028-04-20T21:00:00Z").status).toBe(
      "RUNNING"
    );
    expect(getContradictoire(journal, "2028-04-20T22:00:00Z")).toMatchObject({
      status: "DEEMED_ACCEPTED",
      isClosed: true,
    });
  });

  it("répute reçue à son partage une L48 jamais ouverte en 15 jours", () => {
    const { journal } = createJournalWithL48();

    expect(getContradictoire(journal, "2028-04-25T12:00:00Z").status).toBe(
      "WAITING_OPENING"
    );
    expect(getContradictoire(journal, "2028-04-26T12:00:00Z")).toMatchObject({
      status: "DEEMED_ACCEPTED",
      deadline: "2028-04-18",
    });
  });

  it("retient la dernière réponse avant l'échéance, y compris tard le dernier jour", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    openDocument(journal, l48DocumentId, "2028-04-12T09:00:00Z");
    respond(journal, "L48_CONTESTED", "2028-04-14T10:00:00Z");
    respond(journal, "L48_ACCEPTED", "2028-04-20T21:30:00Z");

    expect(getContradictoire(journal, "2028-04-25T12:00:00Z").status).toBe(
      "ACCEPTED"
    );
  });

  it("ignore une réponse arrivée après l'échéance", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    openDocument(journal, l48DocumentId, "2028-04-12T09:00:00Z");
    respond(journal, "L48_CONTESTED", "2028-04-14T10:00:00Z");
    respond(journal, "L48_ACCEPTED", "2028-04-20T22:30:00Z");

    expect(getContradictoire(journal, "2028-04-25T12:00:00Z").status).toBe(
      "CONTESTED"
    );
  });

  it("tient pour reçue une L48 à laquelle l'opérateur répond sans l'avoir ouverte", () => {
    const { journal } = createJournalWithL48();
    respond(journal, "L48_CONTESTED", "2028-04-22T10:00:00Z");

    expect(getContradictoire(journal, "2028-05-15T12:00:00Z")).toMatchObject({
      status: "CONTESTED",
      deadline: "2028-04-30",
    });
  });

  it("ignore une réponse donnée à une L48 retirée depuis", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    openDocument(journal, l48DocumentId, "2028-04-11T09:00:00Z");
    respond(journal, "L48_CONTESTED", "2028-04-12T10:00:00Z");
    withdraw(journal, l48DocumentId, "2028-04-13T10:00:00Z");
    shareAgentDocument(journal, { types: ["L48"], at: "2028-04-14T10:00:00Z" });

    expect(getContradictoire(journal, "2028-04-15T12:00:00Z").status).toBe(
      "WAITING_OPENING"
    );
  });

  it("s'ancre sur la première L48 partagée et non retirée", () => {
    const { journal, l48DocumentId } = createJournalWithL48();
    withdraw(journal, l48DocumentId, "2028-04-11T10:00:00Z");
    const secondL48DocumentId = shareAgentDocument(journal, {
      types: ["L48"],
      at: "2028-04-12T10:00:00Z",
    });
    shareAgentDocument(journal, { types: ["L48"], at: "2028-04-13T10:00:00Z" });

    expect(
      getContradictoire(journal, "2028-04-14T12:00:00Z").l48DocumentId
    ).toBe(secondL48DocumentId);
  });
});
