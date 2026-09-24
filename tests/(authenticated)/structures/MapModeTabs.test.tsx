import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MapModeTabs } from "@/app/(authenticated)/(with-menu)/structures/_components/MapModeTabs";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));
vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("MapModeTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("vue=carte");
  });

  it("coche Structures par défaut", () => {
    render(<MapModeTabs />);

    expect(screen.getByLabelText("Structures")).toBeChecked();
  });

  it("pose mode=places dans l'URL en conservant les autres paramètres", async () => {
    render(<MapModeTabs />);

    await userEvent.click(screen.getByLabelText("Places"));

    expect(mockReplace).toHaveBeenCalledWith(
      "?vue=carte&mode=places",
      expect.anything()
    );
  });

  it("retire le mode de l'URL au retour sur Structures", async () => {
    mockSearchParams = new URLSearchParams("vue=carte&mode=places");
    render(<MapModeTabs />);

    await userEvent.click(screen.getByLabelText("Structures"));

    expect(mockReplace).toHaveBeenCalledWith("?vue=carte", expect.anything());
  });

  it("désactive Places et affiche Structures sur l'onglet Fermées", () => {
    mockSearchParams = new URLSearchParams(
      "vue=carte&mode=places&statut=fermees"
    );
    render(<MapModeTabs />);

    expect(screen.getByLabelText("Places")).toBeDisabled();
    expect(screen.getByLabelText("Structures")).toBeChecked();
    const hintedLabel = screen
      .getAllByTitle(
        "Les places ne sont localisées que pour les structures actives"
      )
      .find((element) => element.tagName === "SPAN");
    expect(hintedLabel).toHaveTextContent("Places");
  });
});
