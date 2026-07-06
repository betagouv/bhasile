import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StructureCard } from "@/app/components/StructureCard";
import { StructureType } from "@/types/structure.type";

const baseProps = {
  nom: "ACTION NORMANDIE",
  type: StructureType.CADA,
  operateur: { name: "Croix-Rouge" },
  departementAdministratif: "Manche",
};

describe("StructureCard", () => {
  it("affiche le préfixe codeBhasile quand il est fourni", () => {
    // WHEN
    render(<StructureCard {...baseProps} codeBhasile="75001001" />);

    // THEN
    expect(
      screen.getByText("75001001 - CADA, Croix-Rouge, Manche")
    ).toBeInTheDocument();
  });

  it("omet le préfixe codeBhasile quand il est absent", () => {
    // WHEN
    render(<StructureCard {...baseProps} />);

    // THEN
    expect(
      screen.getByText("CADA, Croix-Rouge, Manche")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/ - CADA, Croix-Rouge, Manche/)
    ).not.toBeInTheDocument();
  });
});
