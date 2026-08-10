import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "@/app/components/SearchBar";
import { SEARCH_NAVIGATION_KEY, SEARCH_PARAM_DEBOUNCE_MS } from "@/constants";
import { FetchState } from "@/types/fetch-state.type";

const mockRouterReplace = vi.fn();
const mockSetFetchState = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("écrit le terme recherché dans l'URL après le debounce", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<SearchBar placeholder="Nom d'opérateur" inputId="search" />);

    // WHEN
    await user.type(screen.getByPlaceholderText("Nom d'opérateur"), "coquelic");
    await vi.waitFor(
      () => expect(mockRouterReplace).toHaveBeenCalledWith("?search=coquelic"),
      { timeout: SEARCH_PARAM_DEBOUNCE_MS * 4 }
    );
  });

  it("publie l'attente de navigation sous la clé partagée", async () => {
    // WHEN
    render(<SearchBar placeholder="Nom d'opérateur" inputId="search" />);

    // THEN — au montage, aucune navigation en cours
    expect(mockSetFetchState).toHaveBeenCalledWith(
      SEARCH_NAVIGATION_KEY,
      FetchState.IDLE
    );
  });
});
