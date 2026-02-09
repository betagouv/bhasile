import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderButton } from "@/app/components/lists/OrderButton";
import { StructureColumn } from "@/types/ListColumn";

export const getOrderButton = (column: StructureColumn) => {
  const allButtons = screen.getAllByRole("button");
  const matchingButton = allButtons.find((button) => {
    const ariaLabel = button.getAttribute("aria-label");
    return (
      ariaLabel?.includes(`Trier par ${column}`) ||
      ariaLabel === "Supprimer le tri"
    );
  });
  if (!matchingButton) {
    throw new Error(
      `Button with column ${column} not found. Available buttons: ${allButtons
        .map((b) => b.getAttribute("aria-label"))
        .join(", ")}`
    );
  }
  return matchingButton;
};

describe("OrderButton", () => {
  it("should call handleOrdering when clicked", async () => {
    const user = userEvent.setup();
    const handleOrdering = vi.fn();

    render(
      <OrderButton
        column="dnaCode"
        currentColumn={null}
        currentDirection={null}
        handleOrdering={handleOrdering}
      />
    );

    const button = getOrderButton("dnaCode");
    await user.click(button);

    expect(handleOrdering).toHaveBeenCalledWith("dnaCode");
  });

  it("should highlight ascending arrow when column is active and direction is asc", () => {
    render(
      <OrderButton
        column="dnaCode"
        currentColumn="dnaCode"
        currentDirection="asc"
        handleOrdering={vi.fn()}
      />
    );

    const button = getOrderButton("dnaCode");
    expect(button).toHaveAttribute("aria-sort", "ascending");
    // Verify icons are hidden from screen readers
    const ascendingArrow = button.querySelector(".fr-icon-arrow-up-s-line");
    expect(ascendingArrow).toHaveAttribute("aria-hidden", "true");
    expect(ascendingArrow).toHaveClass("text-title-blue-france");
  });

  it("should highlight descending arrow when column is active and direction is desc", () => {
    render(
      <OrderButton
        column="type"
        currentColumn="type"
        currentDirection="desc"
        handleOrdering={vi.fn()}
      />
    );

    const button = getOrderButton("type");
    expect(button).toHaveAttribute("aria-sort", "descending");

    const descendingArrow = button.querySelector(".fr-icon-arrow-down-s-line");
    expect(descendingArrow).toHaveAttribute("aria-hidden", "true");
    expect(descendingArrow).toHaveClass("text-title-blue-france");
  });

  it("should not highlight arrows when column is not active", () => {
    render(
      <OrderButton
        column="type"
        currentColumn="dnaCode"
        currentDirection="asc"
        handleOrdering={vi.fn()}
      />
    );

    const button = getOrderButton("type");
    expect(button).toHaveAttribute("aria-sort", "none");

    const ascendingArrow = button.querySelector(".fr-icon-arrow-up-s-line");
    const descendingArrow = button.querySelector(".fr-icon-arrow-down-s-line");
    expect(ascendingArrow).toHaveAttribute("aria-hidden", "true");
    expect(descendingArrow).toHaveAttribute("aria-hidden", "true");
    expect(ascendingArrow).not.toHaveClass("text-title-blue-france");
    expect(descendingArrow).not.toHaveClass("text-title-blue-france");
  });
});
