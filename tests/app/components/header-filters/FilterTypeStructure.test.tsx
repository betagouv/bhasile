import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterTypeStructure } from "@/app/components/header-filters/FilterTypeStructure";

describe("FilterTypeStructure", () => {
  it("ne coche aucun type quand la sélection est vide", () => {
    render(<FilterTypeStructure selection={[]} onChange={vi.fn()} />);

    expect(screen.getByLabelText("CADA")).not.toBeChecked();
    expect(screen.getByLabelText("HUDA")).not.toBeChecked();
  });

  it("coche uniquement les types sélectionnés", () => {
    render(<FilterTypeStructure selection={["CADA"]} onChange={vi.fn()} />);

    expect(screen.getByLabelText("CADA")).toBeChecked();
    expect(screen.getByLabelText("CAES")).not.toBeChecked();
  });

  it("ajoute le type cliqué à la sélection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterTypeStructure selection={["CADA"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("HUDA"));

    expect(onChange).toHaveBeenCalledWith(["CADA", "HUDA"]);
  });

  it("retire le filtre quand tous les types finissent cochés", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterTypeStructure
        selection={["CADA", "CAES", "CPH"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByLabelText("HUDA"));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
