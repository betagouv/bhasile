import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFilterNavigation } from "@/app/hooks/useFilterNavigation";
import { SearchParamsNavigationOptions } from "@/app/hooks/useSearchParamsNavigation";
import { GLOBAL_FILTERS_COOKIE } from "@/constants";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/app/hooks/useListNavigation", () => ({
  useListNavigation: () => (navigate: () => void) => navigate(),
}));

describe("useFilterNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("page=3&search=coquelic");
    document.cookie = `${GLOBAL_FILTERS_COOKIE}=; path=/`;
  });

  it("met à jour la seule clé modifiée dans les filtres mémorisés", async () => {
    // GIVEN
    const user = userEvent.setup();
    document.cookie = `${GLOBAL_FILTERS_COOKIE}=${encodeURIComponent("departements=14%2C50&types=CADA")}; path=/`;
    mockSearchParams = new URLSearchParams("departements=14%2C50&types=CADA");
    render(<Filter filterKey="types" values={[]} />);

    // WHEN
    await user.click(screen.getByRole("button", { name: "filtrer" }));

    // THEN
    expect(document.cookie).toContain(
      `${GLOBAL_FILTERS_COOKIE}=${encodeURIComponent("departements=14%2C50")}`
    );
  });

  it("ne touche pas au cookie pour un filtre propre à la page", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<Filter filterKey="search" values={["abri"]} />);

    // WHEN
    await user.click(screen.getByRole("button", { name: "filtrer" }));

    // THEN
    expect(document.cookie).not.toContain("search");
  });

  it("joint la sélection et ramène à la première page", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<Filter values={["75", "92"]} />);

    // WHEN
    await user.click(screen.getByRole("button", { name: "filtrer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith(
      "?search=coquelic&departements=75%2C92",
      { scroll: true }
    );
  });

  it("supprime le param quand la sélection est vide", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockSearchParams = new URLSearchParams("page=3&departements=75");
    render(<Filter values={[]} />);

    // WHEN
    await user.click(screen.getByRole("button", { name: "filtrer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith("?", { scroll: true });
  });

  it("transmet le chemin et la désactivation du défilement", async () => {
    // GIVEN — le cas des filtres d'en-tête, qui ne doivent pas remonter la page
    const user = userEvent.setup();
    render(
      <Filter values={["CADA"]} options={{ pathname: "/", scroll: false }} />
    );

    // WHEN
    await user.click(screen.getByRole("button", { name: "filtrer" }));

    // THEN
    expect(mockReplace).toHaveBeenCalledWith(
      "/?search=coquelic&departements=CADA",
      { scroll: false }
    );
  });
});

const Filter = ({
  filterKey = "departements",
  values,
  options,
}: {
  filterKey?: string;
  values: (string | number)[];
  options?: SearchParamsNavigationOptions;
}): ReactElement => {
  const navigateWithFilter = useFilterNavigation();
  return (
    <button onClick={() => navigateWithFilter(filterKey, values, options)}>
      filtrer
    </button>
  );
};
