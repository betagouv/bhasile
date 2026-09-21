import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterTypeStructure } from "@/app/components/header-filters/FilterTypeStructure";

const mockNavigateWithFilter = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("@/app/hooks/useFilterNavigation", () => ({
  useFilterNavigation: () => mockNavigateWithFilter,
}));

describe("FilterTypeStructure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("ne coche aucune case quand aucun type n'est présent dans l'URL", () => {
    render(<FilterTypeStructure />);

    const elementCheckboxAll =
      screen.getByLabelText<HTMLInputElement>("Tous les types");
    const elementCheckboxCada = screen.getByLabelText<HTMLInputElement>("CADA");
    const elementCheckboxHuda = screen.getByLabelText<HTMLInputElement>("HUDA");

    expect(elementCheckboxAll.checked).toBe(false);
    expect(elementCheckboxCada.checked).toBe(false);
    expect(elementCheckboxHuda.checked).toBe(false);
  });

  it("lit la sélection depuis le paramètre types dans l'URL", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("types=CADA"));

    render(<FilterTypeStructure />);

    const elementCheckboxCada = screen.getByLabelText<HTMLInputElement>("CADA");
    const elementCheckboxCaes = screen.getByLabelText<HTMLInputElement>("CAES");

    expect(elementCheckboxCada.checked).toBe(true);
    expect(elementCheckboxCaes.checked).toBe(false);
  });

  it("coche la case 'Tous les types' lorsque tous les types acceptés sont dans l'URL", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("types=CADA,HUDA,CAES,CPH")
    );

    render(<FilterTypeStructure />);

    const elementCheckboxAll =
      screen.getByLabelText<HTMLInputElement>("Tous les types");

    expect(elementCheckboxAll.checked).toBe(true);
  });
});
