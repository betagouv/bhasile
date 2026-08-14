import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "@/app/components/SearchBar";
import { SEARCH_PARAM_DEBOUNCE_MS } from "@/constants";

const PLACEHOLDER = "Nom d'opérateur";

const mockRouterReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("écrit le terme recherché dans l'URL après le debounce", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<SearchBar placeholder={PLACEHOLDER} inputId="search" />);

    // WHEN
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "coquelic");

    // THEN
    await vi.waitFor(
      () => expect(mockRouterReplace).toHaveBeenCalledWith("?search=coquelic", {
        scroll: true,
      }),
      { timeout: SEARCH_PARAM_DEBOUNCE_MS * 4 }
    );
  });

  it("réaligne le champ quand l'URL change sans passer par la saisie", () => {
    // GIVEN — l'agent a déjà cherché « coquelic »
    mockSearchParams = new URLSearchParams("search=coquelic");
    const { rerender } = render(
      <SearchBar placeholder={PLACEHOLDER} inputId="search" />
    );
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue("coquelic");

    // WHEN — retour arrière : l'URL repasse sans recherche
    mockSearchParams = new URLSearchParams();
    rerender(<SearchBar placeholder={PLACEHOLDER} inputId="search" />);

    // THEN
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveValue("");
  });
});
