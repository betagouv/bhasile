import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterTypeStructure } from "@/app/components/header-filters/FilterTypeStructure";

const mockReplace = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

describe("FilterTypeStructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("coche toutes les cases quand aucun type n'est présent dans l'URL", () => {
    render(<FilterTypeStructure />);

    expect(screen.getByLabelText<HTMLInputElement>("CADA").checked).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("HUDA").checked).toBe(true);
  });

  it("lit la sélection depuis le paramètre types", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA"));

    render(<FilterTypeStructure />);

    expect(screen.getByLabelText<HTMLInputElement>("CADA").checked).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("CAES").checked).toBe(false);
  });
});
