import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OperateurSuggestion } from "@/app/hooks/useOperateurSuggestion";
import { FilterOperateur } from "@/components/header-filters/FilterOperateur";
import { FilterSelection } from "@/hooks/useFilterSelection";

const OPERATEURS = [
  { id: "1", key: "1", label: "Adoma", isFiliale: false, hasFiliales: false },
  { id: "2", key: "2", label: "Coallia", isFiliale: false, hasFiliales: false },
] as OperateurSuggestion[];

const mockGetAllOperateurs = vi.fn(async () => OPERATEURS);

vi.mock("@/app/hooks/useOperateurSuggestion", () => ({
  useOperateurSuggestion: () => ({ getAllOperateurs: mockGetAllOperateurs }),
}));

const buildFilterSelection = (selection: string[]): FilterSelection => ({
  selection,
  status: selection.length === 0 ? "all" : "some",
  getCheckedValues: (allValues) =>
    selection.length === 0 ? allValues : selection,
  setCheckedValues: mockSetCheckedValues,
  toggleAll: vi.fn(),
  resetCleared: vi.fn(),
});

const mockSetCheckedValues = vi.fn();

describe("FilterOperateur", () => {
  it("coche les opérateurs sélectionnés", async () => {
    render(<FilterOperateur filterSelection={buildFilterSelection(["2"])} />);

    expect(await screen.findByLabelText("Coallia")).toBeChecked();
    expect(screen.getByLabelText("Adoma")).not.toBeChecked();
  });

  it("décoche l'opérateur cliqué parmi tous les opérateurs", async () => {
    const user = userEvent.setup();
    render(<FilterOperateur filterSelection={buildFilterSelection([])} />);

    await user.click(await screen.findByLabelText("Adoma"));

    expect(mockSetCheckedValues).toHaveBeenCalledWith(["2"], ["1", "2"]);
  });

  it("filtre la liste par la recherche sans toucher à la sélection", async () => {
    const user = userEvent.setup();
    render(<FilterOperateur filterSelection={buildFilterSelection(["2"])} />);

    await user.type(await screen.findByRole("searchbox"), "ado");

    expect(screen.getByLabelText("Adoma")).toBeInTheDocument();
    expect(screen.queryByLabelText("Coallia")).not.toBeInTheDocument();
    expect(mockSetCheckedValues).not.toHaveBeenCalled();
  });
});
