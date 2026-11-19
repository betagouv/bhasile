import { createSessionUser } from "tests/test-utils/factories/session-user.factory";
import {
  createDepartementPerimeter,
  createGrantDb,
  createNationalPerimeter,
  createRegionPerimeter,
  createUserWithGrants,
} from "tests/test-utils/factories/user-with-grants.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  countNotifications,
  getNotifications,
  hasNotificationBell,
  markNotificationRead,
} from "@/app/api/notifications/notification.service";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";

const mockGetUserWithGrantsByEmail = vi.fn();
const mockFindNotificationUser = vi.fn();
const mockFindNotificationTarifications = vi.fn();
const mockFindNotificationConversations = vi.fn();
const mockCreateNotificationRead = vi.fn();

vi.mock("@/app/api/users/user.repository", () => ({
  getUserWithGrantsByEmail: (...args: unknown[]) =>
    mockGetUserWithGrantsByEmail(...args),
}));

vi.mock("@/app/api/notifications/notification.repository", () => ({
  findNotificationUser: (...args: unknown[]) =>
    mockFindNotificationUser(...args),
  findNotificationTarifications: (...args: unknown[]) =>
    mockFindNotificationTarifications(...args),
  findNotificationConversations: (...args: unknown[]) =>
    mockFindNotificationConversations(...args),
  createNotificationRead: (...args: unknown[]) =>
    mockCreateNotificationRead(...args),
  updateNotificationSeenAt: vi.fn(),
}));

const USER_ID = 30;
const CREATED_AT = new Date("2028-01-01T00:00:00Z");
const SEEN_AT = new Date("2028-04-01T00:00:00Z");
const SESSION_USER = createSessionUser({
  email: " Agent@Ille-et-Vilaine.gouv.fr ",
});

const answerWithUser = (
  perimeter = createDepartementPerimeter("35", "Ille-et-Vilaine"),
  seenAt: Date | null = SEEN_AT
) => {
  mockGetUserWithGrantsByEmail.mockResolvedValue(
    createUserWithGrants({ id: USER_ID, perimeter })
  );
  mockFindNotificationUser.mockResolvedValue({
    createdAt: CREATED_AT,
    notificationSeenAt: seenAt,
  });
  mockFindNotificationTarifications.mockResolvedValue([]);
  mockFindNotificationConversations.mockResolvedValue([]);
};

const getCandidateWhere = () =>
  mockFindNotificationTarifications.mock.calls[0][0].where.events.some;

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("cherche l'utilisateur par son email normalisé", async () => {
    answerWithUser();

    await hasNotificationBell(SESSION_USER);

    expect(mockGetUserWithGrantsByEmail).toHaveBeenCalledWith({
      email: "agent@ille-et-vilaine.gouv.fr",
    });
  });

  it("n'affiche pas de cloche tant que la messagerie est fermée", async () => {
    vi.stubEnv("MESSAGERIE_ENABLED", "false");
    answerWithUser();

    expect(await hasNotificationBell(SESSION_USER)).toBe(false);
  });

  it("n'affiche pas de cloche à un éditeur national, qui n'a pas accès à la tarification", async () => {
    answerWithUser({
      ...createNationalPerimeter(),
      grants: [createGrantDb({ role: AccessRole.ADMIN })],
    });

    expect(await hasNotificationBell(SESSION_USER)).toBe(false);
  });

  it("n'affiche pas de cloche à un lecteur", async () => {
    answerWithUser({
      name: "DDETS Ille-et-Vilaine",
      grants: [
        createGrantDb({
          role: AccessRole.LECTEUR,
          scope: GrantScope.DEPARTEMENT,
          departement: { numero: "35", name: "Ille-et-Vilaine", regionId: 53 },
        }),
      ],
    });

    expect(await hasNotificationBell(SESSION_USER)).toBe(false);
  });

  it("liste les faits depuis la création du compte et tous les messages non lus", async () => {
    answerWithUser();

    await getNotifications(SESSION_USER);

    expect(getCandidateWhere().createdAt).toEqual({ gt: CREATED_AT });
    const conversationWhere =
      mockFindNotificationConversations.mock.calls[0][0].where;
    expect(conversationWhere.messages.some.createdAt).toBeUndefined();
  });

  it("compte les faits et les messages arrivés depuis le repère", async () => {
    answerWithUser();

    await countNotifications(SESSION_USER);

    expect(getCandidateWhere().createdAt).toEqual({ gt: SEEN_AT });
    const conversationWhere =
      mockFindNotificationConversations.mock.calls[0][0].where;
    expect(conversationWhere.messages.some.createdAt).toEqual({ gt: SEEN_AT });
  });

  it("compte depuis la création du compte tant que la cloche n'a jamais été ouverte", async () => {
    answerWithUser(undefined, null);

    await countNotifications(SESSION_USER);

    expect(getCandidateWhere().createdAt).toEqual({ gt: CREATED_AT });
    const conversationWhere =
      mockFindNotificationConversations.mock.calls[0][0].where;
    expect(conversationWhere.messages.some.createdAt).toBeUndefined();
  });

  it("compte depuis la création du compte quand le repère la précède", async () => {
    answerWithUser(undefined, new Date("2027-12-01T00:00:00Z"));

    await countNotifications(SESSION_USER);

    expect(getCandidateWhere().createdAt).toEqual({ gt: CREATED_AT });
  });

  it("limite une DREETS aux faits qu'elle peut recevoir, sans lire les conversations", async () => {
    answerWithUser(createRegionPerimeter());

    await getNotifications(SESSION_USER);

    expect(getCandidateWhere().type).toEqual({
      in: [
        TarificationEventType.APPROVED,
        TarificationEventType.CHANGES_REQUESTED,
        TarificationEventType.L48_CONTESTED,
      ],
    });
    expect(mockFindNotificationConversations).not.toHaveBeenCalled();
  });

  describe("markNotificationRead", () => {
    const tarificationWithDeposit = {
      campaign: { year: 2028 },
      structure: {
        id: 42,
        codeBhasile: "CADA-35-001",
        departementAdministratif: "35",
        operateurId: 7,
      },
      documents: [
        {
          id: 1,
          types: ["CA"],
          status: TarificationDocumentStatus.FINAL,
          openings: [],
        },
      ],
      events: [
        {
          id: 5,
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorId: 10,
          authorLevel: AuthorLevel.OPERATEUR,
          documentId: 1,
          stepCode: null,
          text: null,
          createdAt: new Date("2028-04-10T00:00:00Z"),
          notificationReads: [],
        },
      ],
    };

    it("écrit la lecture d'un fait signalé à l'utilisateur", async () => {
      answerWithUser();
      mockFindNotificationTarifications.mockResolvedValue([
        tarificationWithDeposit,
      ]);

      await markNotificationRead(SESSION_USER, 5);

      expect(mockCreateNotificationRead).toHaveBeenCalledWith(USER_ID, 5);
    });

    it("refuse un fait qui n'est pas une notification de l'utilisateur", async () => {
      answerWithUser(createRegionPerimeter());
      mockFindNotificationTarifications.mockResolvedValue([
        tarificationWithDeposit,
      ]);

      await expect(markNotificationRead(SESSION_USER, 5)).rejects.toThrow(
        "Notification introuvable"
      );
      expect(mockCreateNotificationRead).not.toHaveBeenCalled();
    });
  });
});
