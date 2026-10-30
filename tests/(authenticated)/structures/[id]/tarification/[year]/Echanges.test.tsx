import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Echanges } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/Echanges";
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
        { visibility: "SHARED", text: "Le BP est déposé" },
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

  it("garde le brouillon de chaque canal quand on change d'onglet", async () => {
    answerWith([]);
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

    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("");

    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("Réponse en cours");
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
});
