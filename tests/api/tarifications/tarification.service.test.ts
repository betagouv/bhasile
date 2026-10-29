import { createDepartementalAgent } from "tests/test-utils/factories/session-user.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTarificationParticipant,
  notifyPendingTarificationMessages,
  postTarificationMessage,
} from "@/app/api/tarifications/tarification.service";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  Visibility,
} from "@/generated/prisma/enums";

const mockUpsertStructureTarification = vi.fn();
const mockFindStructureScope = vi.fn();
const mockGetUserWithGrantsByEmail = vi.fn();
const mockFindPendingMessageContexts = vi.fn();
const mockFindUsersWithGrantsOnStructure = vi.fn();
const mockFindNotifiedPairs = vi.fn();
const mockFindReadPairs = vi.fn();
const mockCreateNotificationRecipients = vi.fn();
const mockCreateMessageNotifications = vi.fn();
const mockFindPendingMessageIds = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/app/api/tarifications/tarification.repository", () => ({
  upsertStructureTarification: (...args: unknown[]) =>
    mockUpsertStructureTarification(...args),
  findStructureTarification: vi.fn(),
  findMessageTarification: vi.fn(),
  findStructureScope: (...args: unknown[]) => mockFindStructureScope(...args),
  findPendingMessageContexts: (...args: unknown[]) =>
    mockFindPendingMessageContexts(...args),
}));

vi.mock("@/app/api/conversations/conversation.repository", () => ({
  upsertConversation: vi.fn(),
  createMessage: vi.fn(),
  findMessages: vi.fn(),
  findConversationMessageIds: vi.fn(),
  updateMessageTagKey: vi.fn(),
  createMessageReceipts: vi.fn(),
  findNotifiedPairs: (...args: unknown[]) => mockFindNotifiedPairs(...args),
  findReadPairs: (...args: unknown[]) => mockFindReadPairs(...args),
  createNotificationRecipients: (...args: unknown[]) =>
    mockCreateNotificationRecipients(...args),
  createMessageNotifications: (...args: unknown[]) =>
    mockCreateMessageNotifications(...args),
  findPendingMessageIds: (...args: unknown[]) =>
    mockFindPendingMessageIds(...args),
}));

vi.mock("@/app/api/users/user.repository", () => ({
  getUserWithGrantsByEmail: (...args: unknown[]) =>
    mockGetUserWithGrantsByEmail(...args),
  findUsersWithGrantsOnStructure: (...args: unknown[]) =>
    mockFindUsersWithGrantsOnStructure(...args),
}));

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return { ...actual, CURRENT_YEAR: 2027 };
});

describe("postTarificationMessage", () => {
  const message = {
    structureId: 1,
    year: 2027,
    visibility: Visibility.SHARED,
    author: { id: 1, level: AuthorLevel.DEPARTEMENT, isSuperAdmin: false },
    text: "Bonjour",
    tagKey: null,
    fileKeys: [],
  };

  beforeEach(() => {
    mockUpsertStructureTarification.mockReset();
  });

  it("n'écrit rien quand l'étiquette est inconnue", async () => {
    await expect(
      postTarificationMessage({ ...message, tagKey: "INCONNUE" })
    ).rejects.toThrow("Étiquette inconnue");

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
  });

  it("n'écrit rien quand l'opérateur vise la conversation agents", async () => {
    await expect(
      postTarificationMessage({
        ...message,
        visibility: Visibility.AGENTS,
        author: { id: 1, level: AuthorLevel.OPERATEUR, isSuperAdmin: false },
      })
    ).rejects.toThrow("réservés aux agents");

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
  });
});

describe("getTarificationParticipant", () => {
  const regionalEditorGrant = {
    role: AccessRole.EDITEUR,
    scope: GrantScope.REGION,
    region: { id: 11, name: "Île-de-France", departements: [{ numero: "75" }] },
    departement: null,
    structure: null,
  };
  const buildDatabaseUser = (overrides: object) => ({
    id: 5,
    operateurId: null,
    isSuperAdmin: false,
    isAgent: true,
    grants: [regionalEditorGrant],
    emailPattern: null,
    ...overrides,
  });

  beforeEach(() => {
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: null,
    });
  });

  it("signe au niveau régional un agent éditeur de la région", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(buildDatabaseUser({}));

    const participant = await getTarificationParticipant(
      createDepartementalAgent(["75"]),
      1
    );

    expect(participant).toEqual({
      id: 5,
      level: AuthorLevel.REGION,
      isSuperAdmin: false,
    });
  });

  it("retombe au niveau le plus restreint pour un utilisateur qui n'est pas agent en base", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      buildDatabaseUser({ isAgent: false })
    );

    const participant = await getTarificationParticipant(
      createDepartementalAgent(["75"]),
      1
    );

    expect(participant.level).toBe(AuthorLevel.OPERATEUR);
  });
});

describe("notifyPendingTarificationMessages", () => {
  const departementEditorGrant = {
    role: AccessRole.EDITEUR,
    scope: GrantScope.DEPARTEMENT,
    region: null,
    departement: { numero: "75", name: "Paris", regionId: 11 },
    structure: null,
  };
  const buildAgent = (id: number) => ({
    id,
    email: `agent${id}@paris.gouv.fr`,
    operateurId: null,
    isSuperAdmin: false,
    isAgent: true,
    grants: [],
    emailPattern: { isAgent: true, grants: [departementEditorGrant] },
  });
  const buildPendingMessage = ({
    id,
    authorId,
    conversationId,
    visibility,
  }: {
    id: number;
    authorId: number;
    conversationId: number;
    visibility: Visibility;
  }) => ({
    id,
    authorId,
    conversation: {
      id: conversationId,
      visibility,
      structureTarification: {
        structure: {
          id: 42,
          departementAdministratif: "75",
          codeBhasile: "C42",
        },
        campaign: { year: 2027 },
      },
    },
  });
  const getSentEmails = () =>
    mockFetch.mock.calls.map(([, init]) => JSON.parse(init.body));
  const getRecipientEmails = () =>
    getSentEmails().map((email) => email.to[0].email);
  const answerBrevo = (
    answer: (email: string) => Response = (email) =>
      new Response(JSON.stringify({ messageId: `<${email}>` }), {
        status: 201,
      })
  ) =>
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) =>
      answer(JSON.parse(init.body as string).to[0].email)
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BREVO_API_KEY", "cle-brevo");
    vi.stubEnv("BREVO_MESSAGE_TEMPLATE_ID", "12");
    vi.stubEnv("NEXT_URL", "https://bhasile.test");
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
    global.fetch = mockFetch;
    mockFindPendingMessageIds.mockResolvedValue([]);
    mockFindPendingMessageContexts.mockResolvedValue([
      buildPendingMessage({
        id: 9,
        authorId: 1,
        conversationId: 4,
        visibility: Visibility.AGENTS,
      }),
      buildPendingMessage({
        id: 10,
        authorId: 2,
        conversationId: 4,
        visibility: Visibility.AGENTS,
      }),
      buildPendingMessage({
        id: 11,
        authorId: 1,
        conversationId: 5,
        visibility: Visibility.SHARED,
      }),
    ]);
    mockFindUsersWithGrantsOnStructure.mockResolvedValue([
      buildAgent(1),
      buildAgent(2),
      buildAgent(3),
    ]);
    mockFindNotifiedPairs.mockResolvedValue([]);
    mockFindReadPairs.mockResolvedValue([]);
    answerBrevo();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("envoie à chaque agent un seul mail qui regroupe ses messages par conversation, sauf les siens, puis trace les messages", async () => {
    const summary = await notifyPendingTarificationMessages();

    expect(getRecipientEmails()).toEqual([
      "agent2@paris.gouv.fr",
      "agent3@paris.gouv.fr",
      "agent1@paris.gouv.fr",
    ]);
    expect(getSentEmails()[1]).toEqual({
      templateId: 12,
      to: [{ email: "agent3@paris.gouv.fr" }],
      params: {
        nombre: 3,
        conversations: [
          {
            structure: "C42",
            campagne: "2027",
            canal: "Services de l’État seulement",
            lien: "https://bhasile.test/structures/42/tarification/2027?canal=agents",
            nombre: 2,
          },
          {
            structure: "C42",
            campagne: "2027",
            canal: "Tout le monde",
            lien: "https://bhasile.test/structures/42/tarification/2027",
            nombre: 1,
          },
        ],
      },
    });
    expect(mockCreateNotificationRecipients).toHaveBeenCalledWith(
      [9, 10, 11].map((messageId) => ({
        messageId,
        userId: 3,
        email: "agent3@paris.gouv.fr",
        brevoMessageId: "<agent3@paris.gouv.fr>",
      }))
    );
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith(
      [9, 10, 11],
      null
    );
    expect(summary).toEqual({
      sentCount: 3,
      failedCount: 0,
      abandonedCount: 0,
    });
    expect(mockFindUsersWithGrantsOnStructure).toHaveBeenCalledTimes(1);
  });

  it("ne signale pas un message que le destinataire a déjà lu ou dont il a déjà été notifié", async () => {
    mockFindNotifiedPairs.mockResolvedValue([
      { messageId: 9, userId: 2 },
      { messageId: 11, userId: 2 },
    ]);
    mockFindReadPairs.mockResolvedValue([{ messageId: 10, userId: 3 }]);

    await notifyPendingTarificationMessages();

    expect(getRecipientEmails()).toEqual([
      "agent3@paris.gouv.fr",
      "agent1@paris.gouv.fr",
    ]);
    expect(getSentEmails()[0].params.nombre).toBe(2);
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith(
      [9, 10, 11],
      null
    );
  });

  it("laisse à reprendre les seuls messages d'un destinataire dont l'envoi a échoué", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    answerBrevo((email) =>
      email === "agent2@paris.gouv.fr"
        ? new Response("indisponible", { status: 503 })
        : new Response(JSON.stringify({ messageId: `<${email}>` }), {
            status: 201,
          })
    );

    const summary = await notifyPendingTarificationMessages();

    expect(mockCreateNotificationRecipients).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ userId: 2 })])
    );
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith([10], null);
    expect(summary).toEqual({
      sentCount: 2,
      failedCount: 1,
      abandonedCount: 0,
    });
  });

  it("trace un message sans personne à notifier", async () => {
    mockFindPendingMessageContexts.mockResolvedValue([
      buildPendingMessage({
        id: 9,
        authorId: 1,
        conversationId: 4,
        visibility: Visibility.SHARED,
      }),
    ]);
    mockFindUsersWithGrantsOnStructure.mockResolvedValue([buildAgent(1)]);

    await notifyPendingTarificationMessages();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith([9], null);
  });

  it("journalise les mails au lieu de les envoyer sans template Brevo, et trace les messages", async () => {
    const consoleLog = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    vi.stubEnv("BREVO_MESSAGE_TEMPLATE_ID", "");

    const summary = await notifyPendingTarificationMessages();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith(
      "✉️ Mail journalisé, non envoyé :",
      expect.stringContaining("agent3@paris.gouv.fr")
    );
    expect(mockCreateNotificationRecipients).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          brevoMessageId: expect.stringMatching(/^log-/),
        }),
      ])
    );
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith(
      [9, 10, 11],
      null
    );
    expect(summary.sentCount).toBe(3);
  });

  it("fait échouer l'envoi en production sans clé Brevo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("BREVO_API_KEY", "");
    vi.stubEnv("IS_PRODUCTION", "true");

    const summary = await notifyPendingTarificationMessages();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockCreateMessageNotifications).toHaveBeenCalledWith([], null);
    expect(summary.failedCount).toBe(3);
  });

  it("abandonne les messages en attente depuis plus de 3 jours avant d'envoyer", async () => {
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2027-03-10T10:00:00.000Z");
    mockFindPendingMessageIds.mockResolvedValue([1, 2]);

    const summary = await notifyPendingTarificationMessages();

    expect(mockFindPendingMessageIds).toHaveBeenCalledWith(
      new Date("2027-03-07T10:00:00.000Z")
    );
    expect(mockCreateMessageNotifications).toHaveBeenNthCalledWith(
      1,
      [1, 2],
      new Date("2027-03-10T10:00:00.000Z")
    );
    expect(summary.abandonedCount).toBe(2);
  });
});
