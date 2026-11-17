import { describe, expect, it } from "vitest";

import {
  AuthorLevel,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import { isEventShapeValid } from "@/lib/tarification/tarification.event";
import type { TarificationJournalEvent } from "@/types/tarification.type";

const buildEvent = (
  overrides: Partial<Omit<TarificationJournalEvent, "id" | "createdAt">> &
    Pick<TarificationJournalEvent, "type">
): Omit<TarificationJournalEvent, "id" | "createdAt"> => ({
  authorId: 20,
  authorLevel: AuthorLevel.DEPARTEMENT,
  documentId: null,
  stepCode: null,
  text: null,
  ...overrides,
});

describe("isEventShapeValid", () => {
  it("accepte un dépôt de l'opérateur et un dépôt repris par le système", () => {
    expect(
      isEventShapeValid(
        buildEvent({
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorId: 10,
          authorLevel: AuthorLevel.OPERATEUR,
          documentId: 1,
        })
      )
    ).toBe(true);
    expect(
      isEventShapeValid(
        buildEvent({
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorId: null,
          authorLevel: null,
          documentId: 1,
        })
      )
    ).toBe(true);
  });

  it("refuse au système tout autre fait qu'un dépôt", () => {
    expect(
      isEventShapeValid(
        buildEvent({
          type: TarificationEventType.DOCUMENT_SHARED,
          authorId: null,
          authorLevel: null,
          documentId: 1,
        })
      )
    ).toBe(false);
  });

  it("refuse un auteur et un niveau qui ne sont pas nuls ensemble", () => {
    expect(
      isEventShapeValid(
        buildEvent({
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorLevel: null,
          documentId: 1,
        })
      )
    ).toBe(false);
  });

  it("réserve le partage aux agents et la réponse au contradictoire à l'opérateur", () => {
    expect(
      isEventShapeValid(
        buildEvent({
          type: TarificationEventType.DOCUMENT_SHARED,
          authorId: 10,
          authorLevel: AuthorLevel.OPERATEUR,
          documentId: 1,
        })
      )
    ).toBe(false);
    expect(
      isEventShapeValid(
        buildEvent({ type: TarificationEventType.L48_CONTESTED })
      )
    ).toBe(false);
  });

  it("exige un motif non vide pour une demande de modifications", () => {
    const changesRequested = {
      type: TarificationEventType.CHANGES_REQUESTED,
      documentId: 1,
    };

    expect(isEventShapeValid(buildEvent(changesRequested))).toBe(false);
    expect(
      isEventShapeValid(buildEvent({ ...changesRequested, text: "   " }))
    ).toBe(false);
    expect(
      isEventShapeValid(
        buildEvent({ ...changesRequested, text: "Corriger le montant" })
      )
    ).toBe(true);
  });

  it("exige l'étape visée par un sans objet, et refuse un document", () => {
    const notApplicable = {
      type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
      text: "CA jamais reçu",
    };

    expect(isEventShapeValid(buildEvent(notApplicable))).toBe(false);
    expect(
      isEventShapeValid(
        buildEvent({ ...notApplicable, stepCode: TarificationStepCode.RCA })
      )
    ).toBe(true);
    expect(
      isEventShapeValid(
        buildEvent({
          ...notApplicable,
          stepCode: TarificationStepCode.RCA,
          documentId: 1,
        })
      )
    ).toBe(false);
  });
});
