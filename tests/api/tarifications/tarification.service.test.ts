import {
  createDepartementalAgent,
  createSessionGrant,
  createSessionUser,
} from "tests/test-utils/factories/session-user.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  authorizeTarificationDocument,
  depositTarificationDocument,
  getTarificationJournal,
  getTarificationOverview,
  getTarificationParticipant,
  notifyPendingTarificationMessages,
  postTarificationMessage,
  recordTarificationDocumentOpening,
  recordTarificationEvent,
} from "@/app/api/tarifications/tarification.service";
import {
  AccessRole,
  AuthorLevel,
  GrantScope,
  StructureType,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
  Visibility,
} from "@/generated/prisma/enums";
import type { TarificationJournalRead } from "@/types/tarification.type";

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
const { mockCanAccessTarification } = vi.hoisted(() => ({
  mockCanAccessTarification: vi.fn(),
}));
const mockFindStructureTarificationJournal = vi.fn();
const mockFindTarificationCampaign = vi.fn();
const mockCreateTarificationDocumentOpening = vi.fn();
const mockRunInTarificationTransaction = vi.fn();
const mockFindStructureTarificationCampaigns = vi.fn();

// Les opérateurs n'ont pas encore de droit d'édition (feuille de route opérateurs) : on simule leur accès
vi.mock("@/lib/casl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/casl")>();
  mockCanAccessTarification.mockImplementation(actual.canAccessTarification);
  return { ...actual, canAccessTarification: mockCanAccessTarification };
});

vi.mock("@/app/api/tarifications/tarification.repository", () => ({
  upsertStructureTarification: (...args: unknown[]) =>
    mockUpsertStructureTarification(...args),
  findStructureTarification: vi.fn(),
  findMessageTarification: vi.fn(),
  findStructureScope: (...args: unknown[]) => mockFindStructureScope(...args),
  findPendingMessageContexts: (...args: unknown[]) =>
    mockFindPendingMessageContexts(...args),
  findStructureTarificationJournal: (...args: unknown[]) =>
    mockFindStructureTarificationJournal(...args),
  findTarificationCampaign: (...args: unknown[]) =>
    mockFindTarificationCampaign(...args),
  createTarificationDocumentOpening: (...args: unknown[]) =>
    mockCreateTarificationDocumentOpening(...args),
  runInTarificationTransaction: (...args: unknown[]) =>
    mockRunInTarificationTransaction(...args),
  findStructureTarificationCampaigns: (...args: unknown[]) =>
    mockFindStructureTarificationCampaigns(...args),
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

describe("postTarificationMessage", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const message = {
    structureId: 1,
    year: 2027,
    visibility: Visibility.SHARED,
    author: { id: 1, level: AuthorLevel.DEPARTEMENT },
    text: "Bonjour",
    tagKey: null,
    fileKeys: [],
  };

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2027-06-01T12:00:00.000Z");
    mockUpsertStructureTarification.mockReset();
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: null,
      type: StructureType.CADA,
    });
  });

  it("n'écrit rien pour une structure sans tarification", async () => {
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: null,
      type: StructureType.HUDA,
    });

    await expect(postTarificationMessage(message)).rejects.toThrow(
      "CADA et les CPH"
    );

    expect(mockUpsertStructureTarification).not.toHaveBeenCalled();
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
        author: { id: 1, level: AuthorLevel.OPERATEUR },
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

const OPERATEUR_ID = 9;

const buildJournalDocument = (
  id: number,
  status: TarificationDocumentStatus,
  types: TarificationDocumentType[] = ["L48"]
) => ({
  id,
  types,
  status,
  fileUpload: {
    key: `fichier-${id}.pdf`,
    originalName: `fichier-${id}.pdf`,
    mimeType: "application/pdf",
    fileSize: 10,
    sha256: null,
  },
  openings: [],
});

const buildJournalEvent = (
  id: number,
  type: TarificationEventType,
  documentId: number
): TarificationJournalRead["events"][number] => ({
  id,
  type,
  authorId: 1,
  authorLevel: AuthorLevel.DEPARTEMENT,
  documentId,
  stepCode: null,
  text: null,
  createdAt: new Date("2027-04-10T10:00:00Z"),
  author: { name: "Agent" },
});

const DRAFT_DOCUMENT_ID = 1;
const SHARED_DOCUMENT_ID = 2;
const OPERATEUR_DEPOSIT_ID = 3;

const buildStructureJournal = () => ({
  departementAdministratif: "974",
  cpomStructures: [],
  structureTarifications: [
    {
      documents: [
        buildJournalDocument(
          DRAFT_DOCUMENT_ID,
          TarificationDocumentStatus.DRAFT
        ),
        buildJournalDocument(
          SHARED_DOCUMENT_ID,
          TarificationDocumentStatus.FINAL
        ),
        buildJournalDocument(
          OPERATEUR_DEPOSIT_ID,
          TarificationDocumentStatus.SHARED,
          ["CA"]
        ),
      ],
      events: [
        buildJournalEvent(
          1,
          TarificationEventType.DOCUMENT_DEPOSITED,
          DRAFT_DOCUMENT_ID
        ),
        buildJournalEvent(
          2,
          TarificationEventType.DOCUMENT_DEPOSITED,
          SHARED_DOCUMENT_ID
        ),
        buildJournalEvent(
          3,
          TarificationEventType.DOCUMENT_SHARED,
          SHARED_DOCUMENT_ID
        ),
        {
          ...buildJournalEvent(
            4,
            TarificationEventType.DOCUMENT_DEPOSITED,
            OPERATEUR_DEPOSIT_ID
          ),
          authorLevel: AuthorLevel.OPERATEUR,
        },
      ],
    },
  ],
});

describe("getTarificationJournal", () => {
  beforeEach(() => {
    mockFindStructureTarificationJournal.mockResolvedValue(
      buildStructureJournal()
    );
    mockFindTarificationCampaign.mockResolvedValue({
      drlPublishedAt: new Date("2027-03-01T00:00:00Z"),
      drlUrl: "https://www.legifrance.gouv.fr/drl",
    });
  });

  it("montre tout le journal aux agents, au fuseau de la structure", async () => {
    const { journal, drlUrl } = await getTarificationJournal({
      structureId: 1,
      year: 2027,
      reader: { isAgent: true },
    });

    expect(journal).toMatchObject({
      campaignYear: 2027,
      timeZone: "Indian/Reunion",
      drlPublishedAt: "2027-03-01",
      isCoveredByCpom: false,
    });
    expect(journal.documents).toHaveLength(3);
    expect(drlUrl).toBe("https://www.legifrance.gouv.fr/drl");
  });

  it("ne montre à l'opérateur que ses dépôts et les documents partagés", async () => {
    const { journal, state } = await getTarificationJournal({
      structureId: 1,
      year: 2027,
      reader: { isAgent: false },
    });

    expect(journal.documents.map((document) => document.id)).toEqual([
      SHARED_DOCUMENT_ID,
      OPERATEUR_DEPOSIT_ID,
    ]);
    expect(journal.events.map((event) => event.id)).toEqual([3, 4]);
    expect(state.contradictoire.l48DocumentId).toBe(SHARED_DOCUMENT_ID);
  });

  it("renvoie un journal vide pour une campagne sans tarification", async () => {
    mockFindStructureTarificationJournal.mockResolvedValue({
      ...buildStructureJournal(),
      structureTarifications: [],
    });
    mockFindTarificationCampaign.mockResolvedValue(null);

    const { journal, drlUrl } = await getTarificationJournal({
      structureId: 1,
      year: 2027,
      reader: { isAgent: true },
    });

    expect(journal).toMatchObject({
      drlPublishedAt: null,
      documents: [],
      events: [],
      openings: [],
    });
    expect(drlUrl).toBeNull();
  });
});

describe("authorizeTarificationDocument", () => {
  const operateurUser = createSessionUser({
    operateurId: OPERATEUR_ID,
    grants: [createSessionGrant({ structureIds: [1] })],
  });
  const buildDocument = (id: number) => ({
    id,
    structureTarification: { structureId: 1, campaign: { year: 2027 } },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
    mockCanAccessTarification.mockReturnValueOnce(true);
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "974",
      operateurId: OPERATEUR_ID,
      type: StructureType.CADA,
    });
    mockFindStructureTarificationJournal.mockResolvedValue(
      buildStructureJournal()
    );
    mockFindTarificationCampaign.mockResolvedValue(null);
    mockGetUserWithGrantsByEmail.mockResolvedValue({
      id: 50,
      operateurId: OPERATEUR_ID,
      isSuperAdmin: false,
      isAgent: false,
      grants: [],
      emailPattern: null,
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signale l'ouverture à enregistrer pour un document partagé par les agents, sans l'écrire", async () => {
    await expect(
      authorizeTarificationDocument({
        user: operateurUser,
        document: buildDocument(SHARED_DOCUMENT_ID),
      })
    ).resolves.toEqual({ documentId: SHARED_DOCUMENT_ID, userId: 50 });

    expect(mockCreateTarificationDocumentOpening).not.toHaveBeenCalled();
  });

  it("ne signale aucune ouverture pour le propre dépôt de l'opérateur", async () => {
    await expect(
      authorizeTarificationDocument({
        user: operateurUser,
        document: buildDocument(OPERATEUR_DEPOSIT_ID),
      })
    ).resolves.toBeNull();
  });

  it("refuse à l'opérateur une version de travail des agents", async () => {
    await expect(
      authorizeTarificationDocument({
        user: operateurUser,
        document: buildDocument(DRAFT_DOCUMENT_ID),
      })
    ).rejects.toThrow("Aucun fichier trouvé");
  });

  it("refuse à l'opérateur un document retiré", async () => {
    const structureJournal = buildStructureJournal();
    structureJournal.structureTarifications[0].events.push({
      ...buildJournalEvent(
        5,
        TarificationEventType.DOCUMENT_WITHDRAWN,
        SHARED_DOCUMENT_ID
      ),
      text: "Erreur de structure",
    });
    mockFindStructureTarificationJournal.mockResolvedValue(structureJournal);

    await expect(
      authorizeTarificationDocument({
        user: operateurUser,
        document: buildDocument(SHARED_DOCUMENT_ID),
      })
    ).rejects.toThrow("Aucun fichier trouvé");
  });

  it("laisse un agent ouvrir une version de travail sans rien enregistrer", async () => {
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: OPERATEUR_ID,
      type: StructureType.CADA,
    });
    mockGetUserWithGrantsByEmail.mockResolvedValue({
      id: 51,
      operateurId: null,
      isSuperAdmin: false,
      isAgent: true,
      grants: [],
      emailPattern: null,
    });

    await expect(
      authorizeTarificationDocument({
        user: createDepartementalAgent(["75"]),
        document: buildDocument(DRAFT_DOCUMENT_ID),
      })
    ).resolves.toBeNull();

    expect(mockFindStructureTarificationJournal).not.toHaveBeenCalled();
  });
});

describe("recordTarificationDocumentOpening", () => {
  it("enregistre l'ouverture du document par cet utilisateur", async () => {
    await recordTarificationDocumentOpening({ documentId: 2, userId: 50 });

    expect(mockCreateTarificationDocumentOpening).toHaveBeenCalledWith(2, 50);
  });
});

describe("écritures de la tarification", () => {
  const agent = { id: 51, level: AuthorLevel.DEPARTEMENT };
  const transaction = {
    findJournal: vi.fn(),
    findCampaign: vi.fn(),
    createDocument: vi.fn(),
    createEvent: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2027-06-01T12:00:00.000Z");
    mockFindStructureScope.mockResolvedValue({
      id: 1,
      departementAdministratif: "75",
      operateurId: null,
      type: StructureType.CADA,
    });
    transaction.findJournal.mockResolvedValue(buildStructureJournal());
    transaction.findCampaign.mockResolvedValue(null);
    transaction.createDocument.mockResolvedValue({ id: 9 });
    transaction.createEvent.mockResolvedValue({ id: 10 });
    mockRunInTarificationTransaction.mockImplementation(
      (
        _structureId: number,
        _year: number,
        callback: (openTransaction: typeof transaction) => Promise<unknown>
      ) => callback(transaction)
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("depositTarificationDocument", () => {
    const deposit = {
      structureId: 1,
      year: 2027,
      author: agent,
      fileKey: "abc-rca.pdf",
      types: ["RCA" as const],
      status: TarificationDocumentStatus.DRAFT,
    };

    it("relit le journal dans la transaction, puis crée le document", async () => {
      await expect(depositTarificationDocument(deposit)).resolves.toEqual({
        id: 9,
      });

      expect(mockRunInTarificationTransaction).toHaveBeenCalledWith(
        1,
        2027,
        expect.any(Function)
      );
      expect(transaction.findJournal).toHaveBeenCalled();
      expect(mockFindStructureTarificationJournal).not.toHaveBeenCalled();
      expect(transaction.createDocument).toHaveBeenCalledWith({
        fileKey: "abc-rca.pdf",
        types: ["RCA"],
        status: TarificationDocumentStatus.DRAFT,
        author: agent,
      });
    });

    it("n'écrit rien quand une garde refuse le dépôt", async () => {
      await expect(
        depositTarificationDocument({
          ...deposit,
          status: TarificationDocumentStatus.SHARED,
        })
      ).rejects.toThrow("Cet état");

      expect(transaction.createDocument).not.toHaveBeenCalled();
    });

    it("n'ouvre pas de transaction pour une structure sans tarification", async () => {
      mockFindStructureScope.mockResolvedValue({
        id: 1,
        departementAdministratif: "75",
        operateurId: null,
        type: StructureType.HUDA,
      });

      await expect(depositTarificationDocument(deposit)).rejects.toThrow(
        "CADA et les CPH"
      );

      expect(mockRunInTarificationTransaction).not.toHaveBeenCalled();
    });

    it("compte la phase de campagne au fuseau de la structure", async () => {
      vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2027-12-31T21:00:00.000Z");

      await expect(depositTarificationDocument(deposit)).rejects.toThrow(
        "pas ouvert"
      );
    });
  });

  describe("recordTarificationEvent", () => {
    it("relit le journal dans la transaction, puis écrit le fait au nom de l'auteur", async () => {
      await recordTarificationEvent({
        structureId: 1,
        year: 2027,
        author: agent,
        type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
        documentId: null,
        stepCode: null,
        text: "Courrier",
      });

      expect(transaction.findJournal).toHaveBeenCalled();
      expect(mockFindStructureTarificationJournal).not.toHaveBeenCalled();
      expect(transaction.createEvent).toHaveBeenCalledWith({
        type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
        authorId: agent.id,
        authorLevel: agent.level,
        documentId: null,
        stepCode: null,
        text: "Courrier",
      });
    });

    it("n'écrit rien quand une garde refuse le fait", async () => {
      await expect(
        recordTarificationEvent({
          structureId: 1,
          year: 2027,
          author: agent,
          type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
          documentId: null,
          stepCode: null,
          text: null,
        })
      ).rejects.toThrow("pas valide");

      expect(transaction.createEvent).not.toHaveBeenCalled();
    });
  });
});

describe("getTarificationOverview", () => {
  const buildScope = (type: StructureType) => ({
    id: 1,
    codeBhasile: "BHA-1",
    departementAdministratif: "75",
    operateurId: OPERATEUR_ID,
    type,
  });
  const databaseAgent = {
    id: 51,
    operateurId: null,
    isSuperAdmin: false,
    isAgent: true,
    grants: [],
    emailPattern: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("MESSAGERIE_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", "2029-06-01T12:00:00.000Z");
    mockFindStructureTarificationCampaigns.mockResolvedValue([]);
    mockGetUserWithGrantsByEmail.mockResolvedValue(databaseAgent);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("propose aux agents les campagnes en rattrapage, sans les dire ouvertes", async () => {
    mockFindStructureScope.mockResolvedValue(buildScope(StructureType.CADA));

    const overview = await getTarificationOverview(
      createDepartementalAgent(["75"]),
      1
    );

    expect(overview.campaignYears).toEqual([2030, 2029, 2028, 2027]);
    expect(overview.openCampaignYears).toEqual([2029, 2030]);
  });

  it("ne propose pas les campagnes en rattrapage à l'opérateur", async () => {
    mockCanAccessTarification.mockReturnValueOnce(true);
    mockFindStructureScope.mockResolvedValue(buildScope(StructureType.CADA));
    mockGetUserWithGrantsByEmail.mockResolvedValue({
      ...databaseAgent,
      operateurId: OPERATEUR_ID,
      isAgent: false,
    });

    const overview = await getTarificationOverview(
      createSessionUser({ operateurId: OPERATEUR_ID }),
      1
    );

    expect(overview.campaignYears).toEqual([2030, 2029]);
  });

  it("ne propose à une structure non éligible que ses tarifications existantes", async () => {
    mockFindStructureScope.mockResolvedValue(buildScope(StructureType.HUDA));
    mockFindStructureTarificationCampaigns.mockResolvedValue([
      { campaign: { year: 2027 } },
    ]);

    const overview = await getTarificationOverview(
      createDepartementalAgent(["75"]),
      1
    );

    expect(overview.campaignYears).toEqual([2027]);
    expect(overview.openCampaignYears).toEqual([]);
  });
});
