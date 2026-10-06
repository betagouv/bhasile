import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterOperateur } from "@/app/components/header-filters/FilterOperateur";
import { OperateurSuggestion } from "@/app/hooks/useOperateurSuggestion";

const OPERATEURS = [
  { id: "1", key: "1", label: "Adoma", isFiliale: false, hasFiliales: false },
  { id: "2", key: "2", label: "Coallia", isFiliale: false, hasFiliales: false },
] as OperateurSuggestion[];

const mockGetAllOperateurs = vi.fn(async () => OPERATEURS);

vi.mock("@/app/hooks/useOperateurSuggestion", () => ({
  useOperateurSuggestion: () => ({ getAllOperateurs: mockGetAllOperateurs }),
}));

describe("FilterOperateur", () => {
  it("coche les opérateurs sélectionnés", async () => {
    render(<FilterOperateur selection={["2"]} onToggle={vi.fn()} />);

    expect(await screen.findByLabelText("Coallia")).toBeChecked();
    expect(screen.getByLabelText("Adoma")).not.toBeChecked();
  });

  it("bascule l'opérateur cliqué", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FilterOperateur selection={[]} onToggle={onToggle} />);

    await user.click(await screen.findByLabelText("Adoma"));

    expect(onToggle).toHaveBeenCalledWith("1");
  });

  it("filtre la liste par la recherche sans toucher à la sélection", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FilterOperateur selection={["2"]} onToggle={onToggle} />);

    await user.type(await screen.findByRole("searchbox"), "ado");

    expect(screen.getByLabelText("Adoma")).toBeInTheDocument();
    expect(screen.queryByLabelText("Coallia")).not.toBeInTheDocument();
    expect(onToggle).not.toHaveBeenCalled();
  });
});
