import { fakerFR as faker } from "@faker-js/faker";
import dayjs from "dayjs";

import { getNow } from "@/app/utils/now.util";
import {
  TarificationDocumentStatus,
  TarificationEventType,
  TarificationStepCode,
  Visibility,
} from "@/generated/prisma/client";

import type { JournalWriter, SeededAuthor } from "./tarification-journal.seed";

export const daysAgo = (days: number): Date =>
  dayjs(getNow()).subtract(days, "day").toDate();

// Les dépôts ont une échéance de calendrier en N-1 : leurs dates ne suivent pas la date du jour
const inPreviousYear = (campaignYear: number, monthDay: string): Date =>
  new Date(`${campaignYear - 1}-${monthDay}T10:00:00Z`);

const depositOnTime = async (
  writer: JournalWriter,
  { operateur, campaignYear }: ScenarioContext
): Promise<void> => {
  await writer.deposit({
    types: ["CA", "RAPPORT_ACTIVITE"],
    status: TarificationDocumentStatus.FINAL,
    author: operateur,
    at: inPreviousYear(campaignYear, "04-15"),
  });
  await writer.deposit({
    types: ["BP", "RAPPORT_BUDGETAIRE"],
    status: TarificationDocumentStatus.FINAL,
    author: operateur,
    at: inPreviousYear(campaignYear, "10-20"),
  });
};

// Avec une DRL publiée il y a 55 jours, RCA et L48 sont échus depuis 7 jours et la DAB l'est dans 5 jours
export const SCENARIOS: Scenario[] = [
  { label: "rien déposé", write: async () => {} },
  {
    label: "RCA relu, validé et signé, pas encore envoyé",
    write: async (writer, context) => {
      const { agent, reviewer } = context;
      await depositOnTime(writer, context);
      const firstDraftId = await writer.deposit({
        types: ["RCA"],
        status: TarificationDocumentStatus.DRAFT,
        author: agent,
        at: daysAgo(12),
      });
      await writer.addMessage({
        visibility: Visibility.AGENTS,
        author: agent,
        text: "Première version du RCA à relire.",
        tagKey: "RCA",
        at: daysAgo(12),
      });
      await writer.addEvent({
        type: TarificationEventType.CHANGES_REQUESTED,
        author: reviewer,
        documentId: firstDraftId,
        text: "Le résultat à reprendre ne correspond pas au CA.",
        at: daysAgo(10),
      });
      const secondDraftId = await writer.deposit({
        types: ["RCA"],
        status: TarificationDocumentStatus.DRAFT,
        author: agent,
        at: daysAgo(8),
      });
      await writer.addEvent({
        type: TarificationEventType.APPROVED,
        author: reviewer,
        documentId: secondDraftId,
        at: daysAgo(6),
      });
      await writer.addMessage({
        visibility: Visibility.AGENTS,
        author: reviewer,
        text: "Validé de mon côté, tu peux le faire signer.",
        tagKey: "RCA",
        readBy: agent,
        at: daysAgo(6),
      });
      await writer.deposit({
        types: ["RCA"],
        status: TarificationDocumentStatus.FINAL,
        author: agent,
        at: daysAgo(3),
      });
    },
  },
  {
    label: "RCA sans objet, L48 pas encore ouverte",
    write: async (writer, context) => {
      const { agent } = context;
      await depositOnTime(writer, context);
      await writer.addEvent({
        type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
        author: agent,
        stepCode: TarificationStepCode.RCA,
        text: "Première année d'exercice : pas de CA à reprendre.",
        at: daysAgo(20),
      });
      await writer.share(["L48"], agent, daysAgo(3));
    },
  },
  {
    label: "contradictoire en cours, RCA et L48 dans le même document",
    write: async (writer, context) => {
      const { agent, operateur } = context;
      await depositOnTime(writer, context);
      const l48DocumentId = await writer.share(
        ["RCA", "L48"],
        agent,
        daysAgo(3)
      );
      await writer.open(l48DocumentId, operateur, daysAgo(2));
      await writer.addMessage({
        visibility: Visibility.SHARED,
        author: operateur,
        text: "Pouvez-vous préciser le calcul du groupe II ?",
        tagKey: "L48",
        at: daysAgo(1),
      });
    },
  },
  {
    label: "contradictoire contesté",
    write: async (writer, context) => {
      const { agent, operateur } = context;
      await depositOnTime(writer, context);
      await writer.share(["RCA"], agent, daysAgo(25));
      const l48DocumentId = await writer.share(["L48"], agent, daysAgo(20));
      await writer.open(l48DocumentId, operateur, daysAgo(18));
      const responseDocumentId = await writer.deposit({
        types: ["REPONSE_CONTRADICTOIRE"],
        status: TarificationDocumentStatus.FINAL,
        author: operateur,
        at: daysAgo(15),
      });
      await writer.addEvent({
        type: TarificationEventType.L48_CONTESTED,
        author: operateur,
        documentId: responseDocumentId,
        text: faker.lorem.paragraph(),
        at: daysAgo(15),
      });
      await writer.addMessage({
        visibility: Visibility.SHARED,
        author: agent,
        text: "Bien reçu, nous revenons vers vous avec la DAB.",
        tagKey: "L48",
        at: daysAgo(12),
      });
    },
  },
  {
    label: "L48 jamais ouverte, réputée acceptée",
    write: async (writer, context) => {
      const { agent } = context;
      await depositOnTime(writer, context);
      await writer.share(["RCA"], agent, daysAgo(35));
      await writer.share(["L48"], agent, daysAgo(30));
    },
  },
  {
    label: "campagne bouclée",
    write: async (writer, context) => {
      const { agent, operateur } = context;
      await depositOnTime(writer, context);
      await writer.share(["RCA"], agent, daysAgo(45));
      const l48DocumentId = await writer.share(["L48"], agent, daysAgo(40));
      await writer.open(l48DocumentId, operateur, daysAgo(39));
      await writer.addEvent({
        type: TarificationEventType.L48_ACCEPTED,
        author: operateur,
        at: daysAgo(38),
      });
      await writer.share(["DAB"], agent, daysAgo(25));
      await writer.addMessage({
        visibility: Visibility.SHARED,
        author: agent,
        text: "La DAB est disponible, l'arrêté suivra.",
        tagKey: "DAB",
        at: daysAgo(25),
      });
      await writer.share(["ARRETE"], agent, daysAgo(10));
    },
  },
  {
    label: "CA en retard, versions de travail et retrait",
    write: async (writer, { agent, reviewer, operateur, campaignYear }) => {
      await writer.deposit({
        types: ["CA"],
        status: TarificationDocumentStatus.FINAL,
        author: operateur,
        at: inPreviousYear(campaignYear, "05-20"),
      });
      const draftDocumentId = await writer.deposit({
        types: ["RCA"],
        status: TarificationDocumentStatus.DRAFT,
        author: agent,
        at: daysAgo(20),
      });
      await writer.addEvent({
        type: TarificationEventType.CHANGES_REQUESTED,
        author: reviewer,
        documentId: draftDocumentId,
        text: faker.lorem.sentence(),
        at: daysAgo(18),
      });
      const withdrawnDocumentId = await writer.share(
        ["RCA"],
        agent,
        daysAgo(12)
      );
      await writer.addEvent({
        type: TarificationEventType.DOCUMENT_WITHDRAWN,
        author: agent,
        documentId: withdrawnDocumentId,
        text: "Erreur de structure",
        at: daysAgo(11),
      });
    },
  },
  {
    label: "hors Bhasile",
    write: async (writer, { agent }) => {
      await writer.addEvent({
        type: TarificationEventType.OUT_OF_APP_DECLARED,
        author: agent,
        text: "Tarification menée par courrier",
        at: daysAgo(40),
      });
    },
  },
];

type ScenarioContext = {
  agent: SeededAuthor;
  reviewer: SeededAuthor;
  operateur: SeededAuthor;
  campaignYear: number;
};

type Scenario = {
  label: string;
  write: (writer: JournalWriter, context: ScenarioContext) => Promise<void>;
};
