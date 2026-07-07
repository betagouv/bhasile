import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorToast } from "@/app/components/ErrorToast";
import { FetchState } from "@/types/fetch-state.type";

const mocks = vi.hoisted(() => ({
  fetchStates: new Map<string, { state: FetchState; errorMessage?: string }>(),
  getErrorMessage: (): string | undefined => undefined,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/structures/1",
}));

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({
    fetchStates: mocks.fetchStates,
    getErrorMessage: mocks.getErrorMessage,
    setFetchState: vi.fn(),
  }),
}));

describe("ErrorToast", () => {
  beforeEach(() => {
    mocks.fetchStates = new Map();
    mocks.getErrorMessage = () => undefined;
  });

  it("ne rend rien sans erreur de save", () => {
    render(<ErrorToast />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("affiche le message serveur dans « Voir l’erreur » et dans le mail", () => {
    mocks.fetchStates = new Map([
      [
        "structure-save",
        { state: FetchState.ERROR, errorMessage: "FINESS obligatoire" },
      ],
    ]);
    mocks.getErrorMessage = () => "FINESS obligatoire";

    render(<ErrorToast />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Vos données n’ont pas pu être sauvegardées"
    );
    expect(screen.getByText("Voir l’erreur")).toBeInTheDocument();
    expect(screen.getByText("FINESS obligatoire")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /contactez-nous/i })
    ).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("FINESS obligatoire"))
    );
  });

  it("garde le disclosure hors de la live region (RGAA)", () => {
    mocks.fetchStates = new Map([
      [
        "structure-save",
        { state: FetchState.ERROR, errorMessage: "Erreur détaillée" },
      ],
    ]);
    mocks.getErrorMessage = () => "Erreur détaillée";

    render(<ErrorToast />);

    const alert = screen.getByRole("alert");
    expect(within(alert).queryByText("Voir l’erreur")).toBeNull();
  });

  it("n’affiche pas « Voir l’erreur » quand l’échec est réseau (pas de message)", () => {
    mocks.fetchStates = new Map([
      ["structure-save", { state: FetchState.ERROR, errorMessage: undefined }],
    ]);
    mocks.getErrorMessage = () => undefined;

    render(<ErrorToast />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Voir l’erreur")).toBeNull();
  });
});
