import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TarificationPage from "@/app/(authenticated)/structures/[id]/tarification/[year]/page";
import { DomainError } from "@/app/utils/domain-error.util";
import type { TarificationJournalRead } from "@/types/tarification.type";

const mockGetServerSession = vi.fn();
const mockGetTarificationOverview = vi.fn();
const mockGetTarificationJournal = vi.fn();
const mockGetFullStructure = vi.fn();
const mockDocumentPanel = vi.fn();
const mockSidebar = vi.fn();
const mockEchanges = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/next-auth/auth", () => ({ authOptions: {} }));

vi.mock("@/app/api/tarifications/tarification.service", () => ({
  getTarificationOverview: (...args: unknown[]) =>
    mockGetTarificationOverview(...args),
  getTarificationJournal: (...args: unknown[]) =>
    mockGetTarificationJournal(...args),
}));

vi.mock("@/app/api/structures/structure.service", () => ({
  getFullStructure: (...args: unknown[]) => mockGetFullStructure(...args),
}));

vi.mock(
  "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/DocumentPanel",
  () => ({
    DocumentPanel: (props: Record<string, unknown>) => {
      mockDocumentPanel(props);
      return <div data-testid="document-panel" />;
    },
  })
);

vi.mock(
  "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/TarificationSidebar",
  () => ({
    TarificationSidebar: (props: Record<string, unknown>) => {
      mockSidebar(props);
      return <div data-testid="sidebar" />;
    },
  })
);

vi.mock(
  "@/app/(authenticated)/structures/[id]/tarification/[year]/_components/Echanges",
  () => ({
    Echanges: (props: Record<string, unknown>) => {
      mockEchanges(props);
      return <div data-testid="echanges" />;
    },
  })
);

const overview = {
  codeBhasile: "BHA-42",
  participant: { id: 3, level: "DEPARTEMENT" },
  isOperateur: false,
  canParticipate: true,
  openCampaignYears: [2026, 2027],
  campaignYears: [2027, 2026, 2024],
  tags: [{ key: "L48", label: "L48 et procédure contradictoire" }],
};

vi.mock("@/hooks/useTarificationActions", () => ({
  useTarificationActions: () => ({ recordEvent: vi.fn() }),
}));

vi.mock("@codegouvfr/react-dsfr/Modal", () => ({
  createModal: () => ({
    open: vi.fn(),
    close: vi.fn(),
    Component: () => null,
  }),
}));

const buildJournalView = (journal: Partial<TarificationJournalRead> = {}) => ({
  journal: {
    campaignYear: 2026,
    timeZone: "Europe/Paris",
    drlPublishedAt: null,
    isCoveredByCpom: false,
    documents: [],
    events: [],
    openings: [],
    ...journal,
  },
  state: {
    isOutOfBhasile: false,
    deposits: [
      { type: "CA", depositedAt: null, deadline: "2025-04-30", isLate: true },
      { type: "BP", depositedAt: null, deadline: "2025-10-31", isLate: false },
    ],
    steps: [
      { code: "RCA", status: "DONE", deadline: null, isLate: false },
      { code: "L48", status: "EXPECTED", deadline: null, isLate: false },
      { code: "DAB", status: "UPCOMING", deadline: null, isLate: false },
      { code: "ARRETE", status: "UPCOMING", deadline: null, isLate: false },
    ],
    contradictoire: {
      status: "NOT_STARTED",
      l48DocumentId: null,
      deadline: null,
      isClosed: false,
    },
  },
  drlUrl: null,
});

const buildSharedDai = (id: number) => ({
  documents: [
    {
      id,
      types: ["DAI" as const],
      status: "FINAL" as const,
      fileUpload: {
        key: "dai.pdf",
        originalName: "dai.pdf",
        mimeType: "application/pdf",
        fileSize: 10,
        sha256: null,
      },
    },
  ],
  events: [
    {
      id: 1,
      type: "DOCUMENT_SHARED" as const,
      authorId: 1,
      authorLevel: "DEPARTEMENT" as const,
      documentId: id,
      stepCode: null,
      text: null,
      createdAt: new Date("2025-06-01T10:00:00Z"),
      author: { name: "Agent" },
    },
  ],
});

const renderPage = async (
  id: string,
  year: string,
  searchParams: { etape?: string } = {}
) =>
  render(
    await TarificationPage({
      params: Promise.resolve({ id, year }),
      searchParams: Promise.resolve(searchParams),
    })
  );

describe("TarificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { email: "agent@test.fr" },
    });
    mockGetTarificationOverview.mockResolvedValue(overview);
    mockGetTarificationJournal.mockResolvedValue(buildJournalView());
    mockGetFullStructure.mockResolvedValue({
      codeBhasile: "BHA-42",
      nom: "Les Mimosas",
      type: "CADA",
      operateurLabel: "Adoma",
      communeAdministrative: "Avranches",
      departementAdministratif: "50",
    });
  });

  it("affiche les échanges d'une campagne ouverte, en écriture", async () => {
    await renderPage("42", "2026");

    expect(screen.getByTestId("echanges")).toBeInTheDocument();
    expect(mockEchanges).toHaveBeenCalledWith(
      expect.objectContaining({
        structureId: 42,
        year: 2026,
        currentUserId: 3,
        isCampaignOpen: true,
        tags: overview.tags,
      })
    );
  });

  it("affiche une campagne passée qui a des échanges, en lecture seule", async () => {
    await renderPage("42", "2024");

    expect(mockEchanges).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2024, isCampaignOpen: false })
    );
  });

  it("reprend l'en-tête de la fiche structure, sous le titre de la campagne", async () => {
    await renderPage("42", "2026");

    expect(screen.getByText("Campagne de tarification")).toBeInTheDocument();
    expect(screen.getByText("BHA-42")).toBeInTheDocument();
    expect(screen.getByText("Les Mimosas")).toBeInTheDocument();
    expect(screen.getByText("Avranches (50)")).toBeInTheDocument();
  });

  it("sélectionne l'étape en cours par défaut, et celle de l'URL sinon", async () => {
    await renderPage("42", "2026");
    expect(mockSidebar).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCode: "L48" })
    );

    await renderPage("42", "2026", { etape: "DAB" });
    expect(mockSidebar).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCode: "DAB" })
    );
  });

  it("ignore une étape inconnue de l'URL", async () => {
    await renderPage("42", "2026", { etape: "INCONNUE" });

    expect(mockSidebar).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCode: "L48" })
    );
  });

  it("présente quatre étapes, et le retard d'un dépôt préliminaire", async () => {
    await renderPage("42", "2026");

    const [props] = mockSidebar.mock.lastCall!;
    expect(props.steps.map((step: { label: string }) => step.label)).toEqual([
      "RCA",
      "L48 (Procédure contradictoire)",
      "L60 (DAB)",
      "Arrêté et tarification",
    ]);
    expect(props.preliminarySections).toEqual([
      { code: "CA", label: "CA et rapport d'activité 2024", isLate: true },
      { code: "BP", label: "BP et rapport budgétaire 2026", isLate: false },
    ]);
  });

  it("propose la DAI partagée dans la campagne précédente, et la lit dans celle-ci", async () => {
    mockGetTarificationJournal.mockImplementation(({ year }) =>
      Promise.resolve(
        buildJournalView(year === 2025 ? buildSharedDai(7) : undefined)
      )
    );

    await renderPage("42", "2026", { etape: "DAI" });

    expect(mockSidebar).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCode: "DAI" })
    );
    const [panelProps] = mockDocumentPanel.mock.lastCall!;
    expect(panelProps.versions.map(({ id }: { id: number }) => id)).toEqual([
      7,
    ]);
  });

  it("ne propose pas une DAI de la campagne précédente restée à l'état de version de travail", async () => {
    const { documents } = buildSharedDai(7);
    mockGetTarificationJournal.mockImplementation(({ year }) =>
      Promise.resolve(
        buildJournalView(
          year === 2025
            ? {
                documents: [{ ...documents[0], status: "DRAFT" }],
              }
            : undefined
        )
      )
    );

    await renderPage("42", "2026", { etape: "DAI" });

    const [props] = mockSidebar.mock.lastCall!;
    expect(props.selectedCode).toBe("L48");
    expect(
      props.preliminarySections.map(({ code }: { code: string }) => code)
    ).toEqual(["CA", "BP"]);
  });

  it("revient à l'étape en cours quand la DAI de l'URL n'existe pas", async () => {
    await renderPage("42", "2026", { etape: "DAI" });

    expect(mockSidebar).toHaveBeenLastCalledWith(
      expect.objectContaining({ selectedCode: "L48" })
    );
  });

  it("lit le journal filtré pour un opérateur, sans nom de relecteur", async () => {
    mockGetTarificationOverview.mockResolvedValue({
      ...overview,
      isOperateur: true,
    });

    await renderPage("42", "2026");

    expect(mockGetTarificationJournal).toHaveBeenCalledWith({
      structureId: 42,
      year: 2026,
      reader: { isAgent: false },
    });
    const [panelProps] = mockDocumentPanel.mock.lastCall!;
    expect(panelProps.reviewerNames).toEqual([]);
  });

  it("renvoie introuvable sans droit de lecture sur la structure", async () => {
    mockGetFullStructure.mockResolvedValue(null);

    await expect(renderPage("42", "2026")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("ne propose aucune action sur une structure non éligible, et le dit", async () => {
    mockGetFullStructure.mockResolvedValue({
      codeBhasile: "BHA-42",
      type: "HUDA",
    });

    await renderPage("42", "2026");

    const [panelProps] = mockDocumentPanel.mock.lastCall!;
    expect(panelProps.actions).toEqual({
      depositOptions: [],
      canMarkNotApplicable: false,
      canRespondToL48: false,
      versionActions: {},
    });
    expect(screen.getByText(/n’a pas de tarification/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hors Bhasile" })
    ).not.toBeInTheDocument();
  });

  it("renvoie introuvable pour une année hors de la liste des campagnes", async () => {
    await expect(renderPage("42", "2031")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renvoie introuvable pour des paramètres invalides", async () => {
    await expect(renderPage("abc", "2026")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockGetTarificationOverview).not.toHaveBeenCalled();
  });

  it("renvoie introuvable quand l'accès à la tarification est refusé", async () => {
    mockGetTarificationOverview.mockRejectedValue(
      new DomainError("Accès refusé à la tarification de la structure", 403)
    );

    await expect(renderPage("42", "2026")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("laisse remonter une erreur inattendue", async () => {
    mockGetTarificationOverview.mockRejectedValue(
      new Error("base injoignable")
    );

    await expect(renderPage("42", "2026")).rejects.toThrow("base injoignable");
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
