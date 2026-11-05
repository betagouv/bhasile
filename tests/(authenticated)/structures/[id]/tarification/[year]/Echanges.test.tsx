import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Echanges } from "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/Echanges";
import { MAX_FILE_SIZE } from "@/constants";
import { FetchStateProvider } from "@/contexts/FetchStateContext";
import { MessageApiRead } from "@/schemas/api/message.schema";

const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/structures/42/tarification/2026",
  useSearchParams: () => mockUseSearchParams(),
}));

const CURRENT_USER_ID = 1;
const OPEN_DRAWER_QUERY = "canal=tous";
const NO_ANCHORS = { SHARED: [], AGENTS: [] };
const NO_UNREAD = { SHARED: 0, AGENTS: 0 };
const OTHER_USER = { id: 2, name: "Paul Martin" };
const MESSAGES_URL = "/api/tarifications/42/2026/messages";
const TAGS = [
  { key: "RCA", label: "RCA" },
  { key: "L48", label: "L48 et procédure contradictoire" },
];

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

const answerWithTags = ({
  messages,
  patchMessage = async () => buildJsonResponse({}),
}: {
  messages: MessageApiRead[];
  patchMessage?: () => Promise<Response>;
}) => {
  mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "PATCH") {
      return patchMessage();
    }
    if (init?.method === "POST") {
      return buildJsonResponse({ id: 99 }, 201);
    }
    return buildJsonResponse(messages);
  });
};

const getPatchCalls = () =>
  mockFetch.mock.calls
    .filter(([, init]) => init?.method === "PATCH")
    .map(([url, init]) => ({ url, body: JSON.parse(init.body) }));

const getReadCount = () =>
  mockFetch.mock.calls.filter(([, init]) => init?.method === undefined).length;

const getComposerTagSelect = () =>
  screen.getByRole("combobox", { name: "Tag" });

const findMessageTagSelect = async () =>
  within(await screen.findByRole("list", { name: "Messages" })).getByRole(
    "combobox",
    { name: "Tag" }
  );

const renderEchanges = (props: Partial<Parameters<typeof Echanges>[0]> = {}) =>
  render(
    <FetchStateProvider>
      <Echanges
        structureId={42}
        year={2026}
        currentUserId={CURRENT_USER_ID}
        isOperateur={false}
        canParticipate
        isCampaignOpen
        tags={TAGS}
        anchorsByVisibility={NO_ANCHORS}
        unreadCounts={NO_UNREAD}
        {...props}
      />
    </FetchStateProvider>
  );

describe("Echanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(OPEN_DRAWER_QUERY));
    global.fetch = mockFetch;
    HTMLDialogElement.prototype.showModal = vi.fn(function (
      this: HTMLDialogElement
    ) {
      this.setAttribute("open", "");
    });
    vi.spyOn(window.history, "replaceState").mockImplementation(
      () => undefined
    );
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
        {
          visibility: "SHARED",
          text: "Le BP est déposé",
          fileKeys: [],
          tagKey: null,
        },
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

  it("montre les échanges sans composer ni accusé de lecture à qui ne participe pas", async () => {
    answerWith([buildMessage()]);

    renderEchanges({ canParticipate: false });

    expect(await screen.findByText("Bonjour")).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText("Écrivez un message")
    ).not.toBeInTheDocument();
    expect(
      mockFetch.mock.calls.filter(([, init]) => init?.method === "POST")
    ).toEqual([]);
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

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "?canal=agents"
    );
  });

  describe("pastilles de non-lus", () => {
    const UNREAD = { SHARED: 2, AGENTS: 1 };

    it("additionne les non-lus des deux canaux sur le bouton, tiroir fermé", () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      renderEchanges({ unreadCounts: UNREAD });

      expect(
        screen.getByRole("button", { name: "Échanges 3 non lus" })
      ).toBeInTheDocument();
    });

    it("n'affiche pas de pastille sans message non lu", () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      renderEchanges();

      expect(
        screen.getByRole("button", { name: "Échanges" })
      ).toBeInTheDocument();
    });

    it("retire la pastille du canal ouvert et garde celle de l'autre canal", async () => {
      answerWith([]);
      renderEchanges({ unreadCounts: UNREAD });

      expect(
        await screen.findByRole("tab", { name: "Tout le monde" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /1 non lu$/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Échanges 1 non lu" })
      ).toBeInTheDocument();
    });
  });

  it("passe au canal partagé depuis le canal agents ouvert par le lien d'un mail", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    answerWith([]);
    renderEchanges();

    fireEvent.click(screen.getByRole("tab", { name: "Tout le monde" }));

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      "?canal=tous"
    );
  });

  describe("tiroir", () => {
    it("ne charge ni n'accuse aucun message tant que le tiroir est fermé", () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      answerWith([buildMessage()]);

      renderEchanges();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ouvre le tiroir au clic sur le bouton en gardant les autres paramètres", () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams("etape=L48"));
      answerWith([]);
      renderEchanges();

      fireEvent.click(screen.getByRole("button", { name: "Échanges" }));

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "?etape=L48&canal=tous"
      );
    });

    it("affiche un tiroir modal quand l'URL le demande", async () => {
      answerWith([]);

      renderEchanges();

      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
      expect(
        await screen.findByRole("dialog", { name: "Échanges" })
      ).toBeInTheDocument();
    });

    it("retire le canal à la fermeture et revient à la page seule", async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
      answerWith([]);
      renderEchanges();

      fireEvent.click(
        screen.getByRole("button", { name: "Fermer les échanges" })
      );

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "/structures/42/tarification/2026"
      );
    });

    it("garde les autres paramètres à la fermeture", () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams("etape=L48&canal=tous")
      );
      answerWith([]);
      renderEchanges();

      fireEvent(screen.getByRole("dialog"), new Event("close"));

      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        "",
        "?etape=L48"
      );
    });

    it("ferme le tiroir au clic sur le fond, pas dans le contenu", () => {
      answerWith([]);
      renderEchanges();

      fireEvent.click(screen.getByRole("heading", { name: "Échanges" }));
      expect(window.history.replaceState).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("dialog"));
      expect(window.history.replaceState).toHaveBeenCalledOnce();
    });

    it("garde le brouillon quand on ferme puis rouvre le tiroir", async () => {
      answerWith([]);
      const buildEchanges = () => (
        <FetchStateProvider>
          <Echanges
            structureId={42}
            year={2026}
            currentUserId={CURRENT_USER_ID}
            isOperateur={false}
            canParticipate
            isCampaignOpen
            tags={TAGS}
            anchorsByVisibility={NO_ANCHORS}
            unreadCounts={NO_UNREAD}
          />
        </FetchStateProvider>
      );
      const { rerender } = render(buildEchanges());
      await screen.findByPlaceholderText("Écrivez un message");
      typeMessage("Réponse en cours");

      mockUseSearchParams.mockReturnValue(new URLSearchParams());
      rerender(buildEchanges());
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      mockUseSearchParams.mockReturnValue(
        new URLSearchParams(OPEN_DRAWER_QUERY)
      );
      rerender(buildEchanges());
      expect(
        await screen.findByPlaceholderText("Écrivez un message")
      ).toHaveValue("Réponse en cours");
    });
  });

  describe("fil et sommaire", () => {
    const ANCHOR = {
      id: "event-1",
      label: "Envoi : L48 2026",
      date: new Date("2026-10-27T08:00:00.000Z"),
    };
    const LATER_ANCHOR = {
      id: "event-2",
      label: "Dépôt : DAB 2026",
      date: new Date("2026-10-27T11:00:00.000Z"),
    };

    it("intercale les jalons du canal affiché dans le fil, par date", async () => {
      answerWith([buildMessage()]);

      renderEchanges({
        anchorsByVisibility: {
          SHARED: [ANCHOR, LATER_ANCHOR],
          AGENTS: [{ ...ANCHOR, id: "event-9", label: "Relecture : L48 2026" }],
        },
      });

      const list = await screen.findByRole("list", { name: "Messages" });
      const texts = within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent);
      expect(texts[0]).toContain("Envoi : L48 2026");
      expect(texts[1]).toContain("Bonjour");
      expect(texts[2]).toContain("Dépôt : DAB 2026");
      expect(screen.queryByText(/Relecture/)).not.toBeInTheDocument();
    });

    it("affiche les jalons même sans aucun message", async () => {
      answerWith([]);

      renderEchanges({
        anchorsByVisibility: { SHARED: [ANCHOR], AGENTS: [] },
      });

      expect(
        await screen.findByRole("list", { name: "Messages" })
      ).toHaveTextContent("Envoi : L48 2026");
      expect(
        screen.queryByText("Aucun message pour l’instant.")
      ).not.toBeInTheDocument();
    });

    it("liste au sommaire les jalons et les seuls messages avec pièces jointes", async () => {
      answerWith([
        buildMessage({ id: 10, text: "Sans pièce jointe" }),
        buildMessage({
          id: 11,
          text: "Avec pièce jointe",
          attachments: [
            {
              id: 1,
              key: "cle",
              originalName: "preuve.pdf",
              mimeType: "application/pdf",
              fileSize: 10,
            },
          ],
        }),
      ]);

      renderEchanges({
        anchorsByVisibility: { SHARED: [ANCHOR], AGENTS: [] },
      });

      const summary = await screen.findByRole("navigation", {
        name: "Sommaire des échanges",
      });
      const entries = within(summary).getAllByRole("button");
      expect(entries).toHaveLength(2);
      expect(entries[0]).toHaveTextContent("Envoi : L48 2026");
      expect(entries[1]).toHaveTextContent("Justificatif");
    });

    it("fait défiler le fil vers l'élément choisi au sommaire", async () => {
      answerWith([]);
      const scrolledElementIds: string[] = [];
      HTMLElement.prototype.scrollIntoView = function (this: HTMLElement) {
        scrolledElementIds.push(this.id);
      };
      renderEchanges({
        anchorsByVisibility: { SHARED: [ANCHOR], AGENTS: [] },
      });
      const summary = await screen.findByRole("navigation", {
        name: "Sommaire des échanges",
      });

      fireEvent.click(within(summary).getByRole("button"));

      expect(scrolledElementIds).toEqual(["jalon-event-1"]);
    });

    it("distingue ses propres messages de ceux des autres", async () => {
      answerWith([
        buildMessage({
          id: 10,
          text: "Le mien",
          author: { id: CURRENT_USER_ID, name: "Moi" },
        }),
        buildMessage({ id: 11, text: "Le sien" }),
      ]);

      renderEchanges();

      expect((await screen.findByText("Le mien")).closest("li")).toHaveClass(
        "self-end"
      );
      expect(screen.getByText("Le sien").closest("li")).toHaveClass(
        "self-start"
      );
    });
  });

  describe("recherche", () => {
    const OLD_MATCH = buildMessage({ id: 10, text: "Excédent de 2024" });
    const OTHER_MESSAGE = buildMessage({ id: 11, text: "Bonne journée" });
    const RECENT_MATCH = buildMessage({
      id: 12,
      text: "L'excédent est validé",
    });
    const MESSAGES = [OLD_MATCH, OTHER_MESSAGE, RECENT_MATCH];
    const ANCHOR = {
      id: "event-1",
      label: "Envoi : L48 2026",
      date: new Date("2026-10-27T08:00:00.000Z"),
    };
    const getList = () => screen.getByRole("list", { name: "Messages" });

    beforeEach(() => {
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect"
      ).mockImplementation(function (this: HTMLElement) {
        const messageId = Number(this.id.replace("message-", ""));
        const top = messageId ? messageId * 100 - getList().scrollTop : 0;
        return { top, height: 0 } as DOMRect;
      });
    });

    const getSearchInput = () =>
      screen.getByRole("searchbox", { name: "Rechercher par mots-clés" });

    const search = (searchQuery: string) =>
      fireEvent.change(getSearchInput(), { target: { value: searchQuery } });

    const renderLoadedEchanges = async (
      props: Partial<Parameters<typeof Echanges>[0]> = {}
    ) => {
      const view = renderEchanges(props);
      await screen.findByText("Bonne journée");
      return view;
    };

    it("surligne les mots trouvés en gardant le fil et ses jalons", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges({
        anchorsByVisibility: { SHARED: [ANCHOR], AGENTS: [] },
      });

      search("excedent");

      const highlights = screen
        .getAllByRole("mark")
        .map((highlight) => highlight.textContent);
      expect(highlights).toEqual(["Excédent", "excédent"]);
      expect(screen.getByText("Bonne journée")).toBeInTheDocument();
      expect(screen.getAllByText(/Envoi : L48/).length).toBeGreaterThan(0);
    });

    it("surligne le nom des pièces jointes", async () => {
      answerWith([
        OTHER_MESSAGE,
        buildMessage({
          id: 13,
          text: "",
          attachments: [
            {
              id: 1,
              key: "cle",
              originalName: "Facture-chauffage.pdf",
              mimeType: "application/pdf",
              fileSize: 1024,
            },
          ],
        }),
      ]);
      await renderLoadedEchanges();

      search("facture");

      expect(screen.getByRole("mark")).toHaveTextContent("Facture");
      expect(screen.getByRole("status")).toHaveTextContent("1 sur 1");
    });

    it("ne cherche pas dans le nom de l'auteur", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();

      search("martin");

      expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
    });

    it("part du résultat le plus récent et fait défiler le fil jusqu'à lui", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();

      search("excedent");

      expect(screen.getByRole("status")).toHaveTextContent("1 sur 2");
      expect(getList().scrollTop).toBe(1200);
    });

    it("remonte et redescend dans les résultats, et boucle aux extrémités", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("excedent");

      fireEvent.click(
        screen.getByRole("button", { name: "Résultat plus ancien" })
      );
      expect(screen.getByRole("status")).toHaveTextContent("2 sur 2");
      expect(getList().scrollTop).toBe(1000);

      fireEvent.click(
        screen.getByRole("button", { name: "Résultat plus ancien" })
      );
      expect(screen.getByRole("status")).toHaveTextContent("1 sur 2");
      expect(getList().scrollTop).toBe(1200);

      fireEvent.click(
        screen.getByRole("button", { name: "Résultat plus récent" })
      );
      expect(screen.getByRole("status")).toHaveTextContent("2 sur 2");
      expect(getList().scrollTop).toBe(1000);
    });

    it("revient au résultat unique quand on a fait défiler le fil ailleurs", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("validé");
      getList().scrollTop = 0;

      fireEvent.keyDown(getSearchInput(), { key: "Enter" });

      expect(screen.getByRole("status")).toHaveTextContent("1 sur 1");
      expect(getList().scrollTop).toBe(1200);
    });

    it("ne surligne que les messages qui contiennent tous les mots", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();

      search("excedent validé");

      expect(
        screen.getAllByRole("mark").map((highlight) => highlight.textContent)
      ).toEqual(["excédent", "validé"]);

      search("excedent chauffage");

      expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
      expect(screen.queryByRole("mark")).not.toBeInTheDocument();
    });

    it("garde la saisie et le focus quand le fil finit de charger", async () => {
      const deferredResponse = createDeferred<Response>();
      mockFetch.mockImplementation(() => deferredResponse.promise);
      renderEchanges();
      const input = getSearchInput();
      input.focus();
      search("excedent");

      deferredResponse.resolve(buildJsonResponse(MESSAGES));

      await screen.findByText("Bonne journée");
      expect(getSearchInput()).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue("excedent");
      expect(screen.getByRole("status")).toHaveTextContent("1 sur 2");
    });

    it("n'affiche pas la barre quand le premier chargement échoue", async () => {
      mockFetch.mockResolvedValue(buildJsonResponse({}, 500));
      renderEchanges();

      await screen.findByText(/n’ont pas pu être chargés/);

      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    });

    it("recolle le fil en bas après l'envoi de son propre message", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      const list = getList();
      Object.defineProperty(list, "scrollHeight", {
        value: 5000,
        configurable: true,
      });
      list.scrollTop = 100;
      fireEvent.scroll(list);
      answerWith([...MESSAGES, buildMessage({ id: 14, text: "Merci" })]);

      typeMessage("Merci");
      fireEvent.click(getSendButton());

      await screen.findByText("Merci");
      await waitFor(() => expect(list.scrollTop).toBe(5000));
    });

    it("ne recolle pas le fil en bas quand un message d'autrui arrive", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      const list = getList();
      Object.defineProperty(list, "scrollHeight", {
        value: 5000,
        configurable: true,
      });
      list.scrollTop = 100;
      fireEvent.scroll(list);
      answerWith([...MESSAGES, buildMessage({ id: 14, text: "Nouveau" })]);

      await vi.advanceTimersByTimeAsync(10_000);

      await screen.findByText("Nouveau");
      expect(list.scrollTop).toBe(100);
    });

    it("passe au résultat suivant à chaque Entrée, sans perdre le focus", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("excedent");
      const input = getSearchInput();
      input.focus();

      fireEvent.keyDown(input, { key: "Enter" });
      expect(screen.getByRole("status")).toHaveTextContent("2 sur 2");
      expect(input).toHaveFocus();

      fireEvent.keyDown(input, { key: "Enter" });
      expect(screen.getByRole("status")).toHaveTextContent("1 sur 2");
    });

    it("garde le résultat courant quand un nouveau message correspond", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("excedent");
      answerWith([
        ...MESSAGES,
        buildMessage({ id: 14, text: "Encore un excédent" }),
      ]);

      typeMessage("Merci");
      fireEvent.click(getSendButton());

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("2 sur 3")
      );
      expect(getList().scrollTop).toBe(1200);
    });

    it("revient au plus récent quand le résultat courant ne correspond plus", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("excedent");
      fireEvent.click(
        screen.getByRole("button", { name: "Résultat plus ancien" })
      );

      search("excedent validé");

      expect(screen.getByRole("status")).toHaveTextContent("1 sur 1");
    });

    it("indique l'absence de résultat, sans flèches ni message masqué", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();

      search("chauffage");

      expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
      expect(
        screen.queryByRole("button", { name: "Résultat plus ancien" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("Bonne journée")).toBeInTheDocument();
      fireEvent.keyDown(getSearchInput(), { key: "Enter" });
      expect(screen.getByRole("status")).toHaveTextContent("Aucun résultat");
    });

    it("n'affiche ni compteur ni surlignage quand la recherche est vidée", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();

      search("excedent");
      search("");

      expect(screen.getByRole("status")).toBeEmptyDOMElement();
      expect(screen.queryByRole("mark")).not.toBeInTheDocument();
    });

    it("garde le mot-clé sur l'autre canal et repart de son résultat le plus récent", async () => {
      answerWith(MESSAGES);
      const { rerender } = await renderLoadedEchanges();
      search("excedent");
      fireEvent.click(
        screen.getByRole("button", { name: "Résultat plus ancien" })
      );

      mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
      rerender(
        <FetchStateProvider>
          <Echanges
            structureId={42}
            year={2026}
            currentUserId={CURRENT_USER_ID}
            isOperateur={false}
            canParticipate
            isCampaignOpen
            tags={TAGS}
            anchorsByVisibility={NO_ANCHORS}
            unreadCounts={NO_UNREAD}
          />
        </FetchStateProvider>
      );

      await waitFor(() => expect(getSearchInput()).toHaveValue("excedent"));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("1 sur 2")
      );
      expect(getList().scrollTop).toBe(1200);
    });

    it("vide la recherche à la fermeture du tiroir", async () => {
      answerWith(MESSAGES);
      await renderLoadedEchanges();
      search("excedent");

      fireEvent.click(
        screen.getByRole("button", { name: "Fermer les échanges" })
      );

      expect(getSearchInput()).toHaveValue("");
      expect(screen.queryByRole("mark")).not.toBeInTheDocument();
    });
  });

  it("garde le texte, les pièces jointes et le tag de chaque canal quand on change d'onglet", async () => {
    answerWithFiles();
    const buildEchanges = () => (
      <FetchStateProvider>
        <Echanges
          structureId={42}
          year={2026}
          currentUserId={CURRENT_USER_ID}
          isOperateur={false}
          canParticipate
          isCampaignOpen
          tags={TAGS}
          anchorsByVisibility={NO_ANCHORS}
          unreadCounts={NO_UNREAD}
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
    fireEvent.change(getComposerTagSelect(), { target: { value: "RCA" } });

    mockUseSearchParams.mockReturnValue(new URLSearchParams("canal=agents"));
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("");
    expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
    expect(getComposerTagSelect()).toHaveValue("");

    mockUseSearchParams.mockReturnValue(new URLSearchParams(OPEN_DRAWER_QUERY));
    rerender(buildEchanges());
    expect(
      await screen.findByPlaceholderText("Écrivez un message")
    ).toHaveValue("Réponse en cours");
    expect(screen.getByText("budget.pdf")).toBeInTheDocument();
    expect(getComposerTagSelect()).toHaveValue("RCA");
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
            tagKey: null,
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
          {
            visibility: "SHARED",
            text: "",
            fileKeys: ["cle-budget.pdf"],
            tagKey: null,
          },
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

  describe("tags", () => {
    it("envoie le tag choisi avec le message puis vide le sélecteur", async () => {
      answerWithTags({ messages: [] });
      renderEchanges();
      await screen.findByText("Aucun message pour l’instant.");

      const tagSelect = screen.getByRole("combobox", { name: "Tag" });
      fireEvent.change(tagSelect, { target: { value: "L48" } });
      typeMessage("Voici nos observations");
      fireEvent.click(getSendButton());

      await waitFor(() =>
        expect(getPostBodies(MESSAGES_URL)).toEqual([
          {
            visibility: "SHARED",
            text: "Voici nos observations",
            fileKeys: [],
            tagKey: "L48",
          },
        ])
      );
      await waitFor(() => expect(tagSelect).toHaveValue(""));
    });

    it("modifie le tag d'un message sur place sans attendre la réponse", async () => {
      const patching = createDeferred<Response>();
      answerWithTags({
        messages: [buildMessage()],
        patchMessage: () => patching.promise,
      });
      renderEchanges();

      const tagSelect = await findMessageTagSelect();
      fireEvent.change(tagSelect, { target: { value: "RCA" } });

      expect(tagSelect).toHaveValue("RCA");
      expect(tagSelect).toBeDisabled();
      expect(getPatchCalls()).toEqual([
        { url: "/api/tarifications/messages/10", body: { tagKey: "RCA" } },
      ]);

      patching.resolve(buildJsonResponse({}));
      await waitFor(() => expect(tagSelect).toBeEnabled());
    });

    it("retire le tag d'un message", async () => {
      answerWithTags({ messages: [buildMessage({ tagKey: "L48" })] });
      renderEchanges();

      const tagSelect = await findMessageTagSelect();
      expect(tagSelect).toHaveValue("L48");
      fireEvent.change(tagSelect, { target: { value: "" } });

      await waitFor(() =>
        expect(getPatchCalls()).toEqual([
          { url: "/api/tarifications/messages/10", body: { tagKey: null } },
        ])
      );
    });

    it("signale l'échec de la modification et relit le fil", async () => {
      answerWithTags({
        messages: [buildMessage()],
        patchMessage: async () =>
          buildJsonResponse(
            {
              error:
                "La campagne 2026 n'est pas ouverte : ses échanges sont en lecture seule",
            },
            409
          ),
      });
      renderEchanges();

      const tagSelect = await findMessageTagSelect();
      const readCountBeforeChange = getReadCount();
      fireEvent.change(tagSelect, { target: { value: "RCA" } });

      expect(await screen.findByText(/n'est pas ouverte/)).toBeInTheDocument();
      await waitFor(() =>
        expect(getReadCount()).toBeGreaterThan(readCountBeforeChange)
      );
      await waitFor(() => expect(tagSelect).toHaveValue(""));
    });

    it("montre le tag en lecture seule à l'opérateur, sans sélecteur ni à l'écriture ni sur les messages", async () => {
      answerWithTags({ messages: [buildMessage({ tagKey: "L48" })] });

      renderEchanges({ isOperateur: true });

      expect(
        await screen.findByText("L48 et procédure contradictoire")
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Écrivez un message")
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Tag" })
      ).not.toBeInTheDocument();
    });

    it("montre le tag en lecture seule à qui consulte sans participer", async () => {
      answerWithTags({ messages: [buildMessage({ tagKey: "RCA" })] });

      renderEchanges({ canParticipate: false });

      expect(await screen.findByText("RCA")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Tag" })
      ).not.toBeInTheDocument();
    });

    it("montre le tag en lecture seule sur une campagne close", async () => {
      answerWithTags({ messages: [buildMessage({ tagKey: "L48" })] });

      renderEchanges({ isCampaignOpen: false });

      expect(
        await screen.findByText("L48 et procédure contradictoire")
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Tag" })
      ).not.toBeInTheDocument();
    });

    it("n'affiche pas de tag sur un message qui n'en a pas", async () => {
      answerWithTags({ messages: [buildMessage()] });

      renderEchanges({ isOperateur: true });

      const messageList = await screen.findByRole("list", { name: "Messages" });
      TAGS.forEach((tag) =>
        expect(
          within(messageList).queryByText(tag.label)
        ).not.toBeInTheDocument()
      );
    });
  });
});
