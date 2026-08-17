import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SearchParamsNavigationOptions,
  useSearchParamsNavigation,
} from "@/app/hooks/useSearchParamsNavigation";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/app/hooks/useListNavigation", () => ({
  useListNavigation: () => (navigate: () => void) => navigate(),
}));

describe("useSearchParamsNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("page=2&search=coquelic");
  });

  it("conserve les paramètres existants et applique la mutation", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(
      <Navigator mutate={(params) => params.set("departements", "75,92")} />
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith(
      "?page=2&search=coquelic&departements=75%2C92",
      { scroll: true }
    );
  });

  it("supprime un paramètre quand la mutation l'efface", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<Navigator mutate={(params) => params.delete("search")} />);

    // WHEN
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith("?page=2", { scroll: true });
  });

  it("préfixe le chemin et désactive le défilement quand on le demande", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(
      <Navigator
        mutate={(params) => params.set("types", "CADA")}
        options={{ pathname: "/structures", scroll: false }}
      />
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "naviguer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith(
      "/structures?page=2&search=coquelic&types=CADA",
      { scroll: false }
    );
  });
});

const Navigator = ({
  mutate,
  options,
}: {
  mutate: (params: URLSearchParams) => void;
  options?: SearchParamsNavigationOptions;
}): ReactElement => {
  const navigateWithParams = useSearchParamsNavigation();
  return (
    <button onClick={() => navigateWithParams(mutate, options)}>
      naviguer
    </button>
  );
};
