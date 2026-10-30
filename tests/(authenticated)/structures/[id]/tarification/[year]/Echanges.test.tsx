import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Echanges } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/Echanges";
import { MAX_FILE_SIZE } from "@/constants";
import { FetchStateProvider } from "@/contexts/FetchStateContext";
import { MessageApiRead } from "@/schemas/api/message.schema";

const mockRouterReplace = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: vi.fn() }),
  usePathname: () => "/structures/42/tarification/2026",
  useSearchParams: () => mockUseSearchParams(),
}));

const CURRENT_USER_ID = 1;
const OTHER_USER = { id: 2, name: "Paul Martin" };
const MESSAGES_URL = "/api/tarifications/42/2026/messages";

const buildMessage = (
  overrides: Partial<MessageApiRead> = {}
): MessageApiRead => ({
  id: 10,
  text: "Bonjour",
  tagKey: null,
  authorLevel: "DEPARTEMENT",
  createdAt: "2026-10-27T09:00:00.000Z",
  author: OTHER_USER,
  receipts: [],
  attachments: [],
  ...overrides,
});

const mockFetch = vi.fn();

const answerWith = (messages: MessageApiRead[]) => {
  mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      return new Response(JSON.stringify({ count: 1 }), { status: 201 });
    }
    return new Response(JSON.stringify(messages), { status: 200 });
  });
};

const getPostBodies = (url: string) =>
  mockFetch.mock.calls
    .filter(([calledUrl, init]) => calledUrl === url && init?.method === "POST")
    .map(([, init]) => JSON.parse(init.body));

const FILES_URL = "/api/files";

const buildJsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

const answerWithFiles = ({
  messages = [],
  uploadFile = async (file: File) =>
    buildJsonResponse({ key: `cle-${file.name}` }),
  postMessage = async () => buildJsonResponse({ id: 99 }, 201),
}: {
  messages?: MessageApiRead[];
  uploadFile?: (file: File) => Promise<Response>;
  postMessage?: () => Promise<Response>;
} = {}) => {
  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === FILES_URL) {
      return uploadFile((init?.body as FormData).get("file") as File);
    }
    if (url.startsWith(`${FILES_URL}/`)) {
      return url.endsWith("?getLink=true")
        ? buildJsonResponse({ url: "https://s3.test/lien-signe" })
        : buildJsonResponse({});
    }
    if (url === MESSAGES_URL && init?.method === "POST") {
      return postMessage();
    }
    return buildJsonResponse(messages);
  });
};

const createDeferred = <T,>() => {
  let resolvePromise: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
};

const buildFile = (name: string): File =>
  new File(["contenu"], name, { type: "application/pdf" });

const attachFiles = (...files: File[]) =>
  fireEvent.change(screen.getByLabelText("Fichiers à joindre"), {
    target: { files },
  });

const typeMessage = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText("Écrivez un message"), {
    target: { value: text },
  });

const getUploadCount = () =>
  mockFetch.mock.calls.filter(([url]) => url === FILES_URL).length;

const getDeletedFileUrls = () =>
  mockFetch.mock.calls
    .filter(([, init]) => init?.method === "DELETE")
    .map(([url]) => url);

const getSendButton = () => screen.getByRole("button", { name: "Envoyer" });

const renderEchanges = (props: Partial<Parameters<typeof Echanges>[0]> = {}) =>
  render(
    <FetchStateProvider>
      <Echanges
        structureId={42}
        year={2026}
        currentUserId={CURRENT_USER_ID}
        isOperateur={false}
        isCampaignOpen
        {...props}
      />
    </FetchStateProvider>
  );

describe("Echanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("affiche le fil du canal partagé avec l'auteur, son niveau et ses lecteurs", async () => {
    answerWith([
      buildMessage({
        receipts: [
          {
            createdAt: "2026-10-27T10:00:00.000Z",
            user: { id: 3, name: "Anne Durand" },
          },
        ],
      }),
    ]);

    renderEchanges();

    expect(await screen.findByText("Bonjour")).toBeInTheDocument();
    expect(screen.getByText("Paul Martin")).toBeInTheDocument();
    expect(screen.getByText(/DDETS/)).toBeInTheDocument();
    expect(screen.getByText("Anne Durand")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(`${MESSAGES_URL}?visibility=SHARED`);
  });

  it("envoie le message dans le canal affiché puis relit le fil", async () => {
    answerWith([]);
    renderEchanges();
    await screen.findByText("Aucun message pour l’instant.");

    fireEvent.change(screen.getByPlaceholderText("Écrivez un message"), {
      target: { value: "Le BP est déposé" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() =>
      expect(getPostBodies(MESSAGES_URL)).toEqual([
        { visibility: "SHARED", text: "Le BP est déposé", fileKeys: [] },
      ])
    );
    await waitFor(() =>
      expect(screen.getByPlaceholderText("Écrivez un message")).toHaveValue("")
    );
    const readCalls = mockFetch.mock.calls.filter(
      ([, init]) => init?.method !== "POST"
    );
    expect(readCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("affiche un message générique et garde le texte quand le réseau coupe", async () => {
    mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        throw new TypeError("Failed to fetch");
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    renderEchanges();
    await screen.findByText("Aucun message pour l’instant.");

    fireEvent.change(screen.getByPlaceholderText("Écrivez un message"), {
      target: { value: "Le BP est déposé" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(
      await screen.findByText("Le message n’a pas pu être envoyé.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Failed to fetch")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Écrivez un message")).toHaveValue(
      "Le BP est déposé"
    );
  });

  it("affiche le message du serveur quand il refuse l'envoi", async () => {
    mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        return new Response(
          JSON.stringify({
            error: "Un message ne peut pas dépasser 10 000 caractères",
          }),
          { status: 400 }
        );
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
    renderEchanges();
    await screen.findByText("Aucun message pour l’instant.");

    fireEvent.change(screen.getByPlaceholderText("Écrivez un message"), {
      target: { value: "Très long" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(
      await screen.findByText(
        "Un message ne peut pas dépasser 10 000 caractères"
      )
    ).toBeInTheDocument();
  });

  it("accuse la lecture des seuls messages d'autrui pas encore lus", async () => {
    answerWith([
      buildMessage({ id: 1 }),
      buildMessage({
        id: 2,
        receipts: [
          {
            createdAt: "2026-10-27T10:00:00.000Z",
            user: { id: CURRENT_USER_ID, name: "Moi" },
          },
        ],
      }),
      buildMessage({ id: 3, author: { id: CURRENT_USER_ID, name: "Moi" } }),
    ]);

    renderEchanges();

    await waitFor(() =>
      expect(getPostBodies(`${MESSAGES_URL}/read`)).toEqual([
        { visibility: "SHARED", messageIds: [1] },
      ])
    );
  });

  it("passe en lecture seule une campagne close", async () => {
    answerWith([]);

    renderEchanges({ isCampaignOpen: false });

    expect(
      await screen.findByText(/campagne 2026 est close/)
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Écrivez un message")
    ).not.toBeInTheDocument();
  });

  it("ouvre le canal agents demandé dans l'URL", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    answerWith([]);

    renderEchanges();

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        `${MESSAGES_URL}?visibility=AGENTS`
      )
    );
  });

  it("inscrit le canal agents dans l'URL quand on change d'onglet", async () => {
    answerWith([]);
    renderEchanges();

    fireEvent.click(
      screen.getByRole("tab", { name: "Services de l’État seulement" })
    );

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith("?canal=agents", {
        scroll: true,
      })
    );
  });

  it("garde le texte et les pièces jointes de chaque canal quand on change d'onglet", async () => {
    answerWithFiles();
    const buildEchanges = () => (
      <FetchStateProvider>
        <Echanges
          structureId={42}
          year={2026}
          currentUserId={CURRENT_USER_ID}
          isOperateur={false}
          isCampaignOpen
        />
      </FetchStateProvider>
    );
    const { rerender } = render(buildEchanges());
    await screen.findByText("Aucun message pour l’instant.");
    fireEvent.change(screen.getByPlaceholderText("Écrivez un message"), {
      target: { value: "Réponse en cours" },
    });
    attachFiles(buildFile("budget.pdf"));
    expect(await screen.findByText("budget.pdf")).toBeInTheDocument();

    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("");
    expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();

    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("Réponse en cours");
    expect(screen.getByText("budget.pdf")).toBeInTheDocument();
  });

  it("ne montre que le canal partagé à l'opérateur, même si l'URL demande le canal agents", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    answerWith([]);

    renderEchanges({ isOperateur: true });

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        `${MESSAGES_URL}?visibility=SHARED`
      )
    );
    expect(
      screen.queryByRole("tab", { name: "Services de l’État seulement" })
    ).not.toBeInTheDocument();
  });

  it("relit le fil toutes les 10 secondes, sauf quand l'onglet est caché", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    answerWith([]);
    renderEchanges();
    await screen.findByText("Aucun message pour l’instant.");
    const countReads = () =>
      mockFetch.mock.calls.filter(([, init]) => init?.method !== "POST").length;

    await vi.advanceTimersByTimeAsync(10_000);
    expect(countReads()).toBe(2);

    const visibilityState = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(countReads()).toBe(2);

    visibilityState.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => expect(countReads()).toBe(3));
  });

  it("cesse de relire le fil et invite à se reconnecter quand la session a expiré", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
      })
    );

    renderEchanges();

    expect(
      await screen.findByText(/Votre session a expiré/)
    ).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  describe("pièces jointes", () => {
    it("envoie les clés des fichiers joints avec le message puis vide la saisie sans supprimer les fichiers", async () => {
      answerWithFiles();
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      attachFiles(buildFile("budget.pdf"), buildFile("annexe.pdf"));
      typeMessage("Ci-joint le budget");

      expect(await screen.findByText("budget.pdf")).toBeInTheDocument();
      expect(screen.getByText("annexe.pdf")).toBeInTheDocument();
      expect(getUploadCount()).toBe(2);
      await waitFor(() => expect(getSendButton()).toBeEnabled());
      fireEvent.click(getSendButton());

      await waitFor(() =>
        expect(getPostBodies(MESSAGES_URL)).toEqual([
          {
            visibility: "SHARED",
            text: "Ci-joint le budget",
            fileKeys: ["cle-budget.pdf", "cle-annexe.pdf"],
          },
        ])
      );
      await waitFor(() =>
        expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument()
      );
      expect(getDeletedFileUrls()).toEqual([]);
    });

    it("envoie un message fait seulement de pièces jointes", async () => {
      answerWithFiles();
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      attachFiles(buildFile("budget.pdf"));
      await waitFor(() => expect(getSendButton()).toBeEnabled());
      fireEvent.click(getSendButton());

      await waitFor(() =>
        expect(getPostBodies(MESSAGES_URL)).toEqual([
          { visibility: "SHARED", text: "", fileKeys: ["cle-budget.pdf"] },
        ])
      );
    });

    it("affiche le refus du serveur sur le fichier et bloque l'envoi jusqu'à son retrait", async () => {
      answerWithFiles({
        uploadFile: async () =>
          buildJsonResponse({ error: "Fichier trop volumineux." }, 400),
      });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      typeMessage("Ci-joint le budget");
      attachFiles(buildFile("gros.pdf"));

      expect(
        await screen.findByText("Fichier trop volumineux.")
      ).toBeInTheDocument();
      expect(getSendButton()).toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: "Retirer gros.pdf" }));

      expect(screen.queryByText("gros.pdf")).not.toBeInTheDocument();
      expect(getSendButton()).toBeEnabled();
      expect(getDeletedFileUrls()).toEqual([]);
    });

    it("refuse sans l'envoyer un fichier trop volumineux", async () => {
      answerWithFiles();
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      const tooLargeFile = buildFile("scan.pdf");
      Object.defineProperty(tooLargeFile, "size", {
        value: MAX_FILE_SIZE + 1,
      });
      attachFiles(tooLargeFile);

      expect(
        await screen.findByText("Fichier trop volumineux (30 Mo maximum).")
      ).toBeInTheDocument();
      expect(getUploadCount()).toBe(0);
      expect(getSendButton()).toBeDisabled();
    });

    it("refuse sans les envoyer les pièces jointes au-delà de 20, en comptant celles déjà jointes", async () => {
      answerWithFiles();
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      attachFiles(
        ...Array.from({ length: 19 }, (_, position) =>
          buildFile(`piece-${position}.pdf`)
        )
      );
      attachFiles(buildFile("derniere.pdf"), buildFile("en-trop.pdf"));

      expect(
        await screen.findByText("20 pièces jointes maximum par message.")
      ).toBeInTheDocument();
      await waitFor(() => expect(getUploadCount()).toBe(20));
      expect(getSendButton()).toBeDisabled();
    });

    it("bloque l'envoi tant qu'un fichier est en cours d'envoi", async () => {
      const upload = createDeferred<Response>();
      answerWithFiles({ uploadFile: () => upload.promise });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      typeMessage("Ci-joint le budget");
      attachFiles(buildFile("budget.pdf"));

      expect(await screen.findByText("Envoi en cours…")).toBeInTheDocument();
      expect(getSendButton()).toBeDisabled();

      upload.resolve(buildJsonResponse({ key: "cle-budget.pdf" }));

      await waitFor(() => expect(getSendButton()).toBeEnabled());
    });

    it("supprime le fichier envoyé quand on retire sa pièce jointe", async () => {
      answerWithFiles();
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      attachFiles(buildFile("budget.pdf"));
      await waitFor(() =>
        expect(screen.queryByText("Envoi en cours…")).not.toBeInTheDocument()
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Retirer budget.pdf" })
      );

      expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
      await waitFor(() =>
        expect(getDeletedFileUrls()).toEqual([`${FILES_URL}/cle-budget.pdf`])
      );
    });

    it("supprime à son arrivée un fichier retiré pendant son envoi, sans le réafficher", async () => {
      const upload = createDeferred<Response>();
      answerWithFiles({ uploadFile: () => upload.promise });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      attachFiles(buildFile("budget.pdf"));
      fireEvent.click(
        await screen.findByRole("button", { name: "Retirer budget.pdf" })
      );
      upload.resolve(buildJsonResponse({ key: "cle-budget.pdf" }));

      await waitFor(() =>
        expect(getDeletedFileUrls()).toEqual([`${FILES_URL}/cle-budget.pdf`])
      );
      expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
    });

    it("garde le texte et les pièces jointes quand l'envoi du message échoue", async () => {
      answerWithFiles({
        postMessage: async () =>
          buildJsonResponse(
            {
              error:
                "La campagne 2026 n'est pas ouverte : ses échanges sont en lecture seule",
            },
            409
          ),
      });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      typeMessage("Ci-joint le budget");
      attachFiles(buildFile("budget.pdf"));
      await waitFor(() => expect(getSendButton()).toBeEnabled());
      fireEvent.click(getSendButton());

      expect(await screen.findByText(/n'est pas ouverte/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Écrivez un message")).toHaveValue(
        "Ci-joint le budget"
      );
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
      expect(getDeletedFileUrls()).toEqual([]);
    });

    it("fige la saisie et les pièces jointes pendant l'envoi du message", async () => {
      const sending = createDeferred<Response>();
      answerWithFiles({ postMessage: () => sending.promise });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      typeMessage("Ci-joint le budget");
      attachFiles(buildFile("budget.pdf"));
      await waitFor(() => expect(getSendButton()).toBeEnabled());
      fireEvent.click(getSendButton());

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Retirer budget.pdf" })
        ).toBeDisabled()
      );
      expect(screen.getByPlaceholderText("Écrivez un message")).toHaveAttribute(
        "readonly"
      );

      sending.resolve(buildJsonResponse({ id: 99 }, 201));

      await waitFor(() =>
        expect(
          screen.getByPlaceholderText("Écrivez un message")
        ).not.toHaveAttribute("readonly")
      );
      expect(getDeletedFileUrls()).toEqual([]);
    });

    it("signale une pièce jointe dont le lien n'a pas pu être obtenu", async () => {
      const openWindow = vi.spyOn(window, "open").mockReturnValue(null);
      answerWithFiles({
        messages: [
          buildMessage({
            attachments: [
              {
                id: 1,
                key: "cle-bp.pdf",
                originalName: "bp.pdf",
                mimeType: "application/pdf",
                fileSize: 1_200_000,
              },
            ],
          }),
        ],
      });
      const answerFiles = mockFetch.getMockImplementation();
      mockFetch.mockImplementation(async (url: string, init?: RequestInit) =>
        url.endsWith("?getLink=true")
          ? buildJsonResponse({ error: "Aucun fichier trouvé" }, 404)
          : answerFiles?.(url, init)
      );
      renderEchanges();

      fireEvent.click(await screen.findByRole("button", { name: "bp.pdf" }));

      expect(
        await screen.findByText(/Le fichier n’a pas pu être ouvert/)
      ).toBeInTheDocument();
      expect(openWindow).not.toHaveBeenCalled();
    });

    it("affiche les pièces jointes du fil et ouvre leur lien signé au clic", async () => {
      const openWindow = vi.spyOn(window, "open").mockReturnValue(null);
      answerWithFiles({
        messages: [
          buildMessage({
            attachments: [
              {
                id: 1,
                key: "cle-bp.pdf",
                originalName: "bp.pdf",
                mimeType: "application/pdf",
                fileSize: 1_200_000,
              },
            ],
          }),
        ],
      });
      renderEchanges();

      fireEvent.click(await screen.findByRole("button", { name: "bp.pdf" }));

      expect(screen.getByText(/PDF – /)).toBeInTheDocument();
      await waitFor(() =>
        expect(openWindow).toHaveBeenCalledWith(
          "https://s3.test/lien-signe",
          "_blank",
          "noopener,noreferrer"
        )
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `${FILES_URL}/cle-bp.pdf?getLink=true`
      );
    });

    it("n'affiche pas de paragraphe vide pour un message sans texte", async () => {
      answerWithFiles({
        messages: [
          buildMessage({
            text: "",
            attachments: [
              {
                id: 1,
                key: "cle-bp.pdf",
                originalName: "bp.pdf",
                mimeType: "application/pdf",
                fileSize: 1_200_000,
              },
            ],
          }),
        ],
      });
      renderEchanges();

      await screen.findByRole("button", { name: "bp.pdf" });

      const messageParagraphs = screen
        .getByRole("list", { name: "Messages" })
        .querySelectorAll(":scope > li > p");
      expect(messageParagraphs).toHaveLength(1);
    });
  });
});
