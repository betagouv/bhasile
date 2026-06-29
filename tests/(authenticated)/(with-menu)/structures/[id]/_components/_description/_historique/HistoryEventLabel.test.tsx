import { render, screen } from "@testing-library/react";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { HistoryEventLabel } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/_historique/HistoryEventLabel";
import { HistoryEvent } from "@/types/structure-history.type";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

const ISO = "2022-02-14T12:00:00.000Z";
const ref = (id: number) => ({ id, codeBhasile: `BHA-NOR-${id}` });
const renderLabel = (event: HistoryEvent) =>
  render(<HistoryEventLabel event={event} />);

describe("HistoryEventLabel", () => {
  it("création sans sources", () => {
    const { container } = renderLabel({
      kind: "CREATION",
      date: ISO,
      sources: [],
    });

    expect(container.textContent).toBe("Création de la structure");
  });

  it("création avec une source (singulier)", () => {
    const { container } = renderLabel({
      kind: "CREATION",
      date: ISO,
      sources: [ref(1)],
    });

    expect(container.textContent).toBe(
      "Création de la structure à partir de la structure BHA-NOR-1"
    );
  });

  it("extension avec plusieurs sources (pluriel)", () => {
    const { container } = renderLabel({
      kind: "EXTENSION",
      date: ISO,
      sources: [ref(1), ref(2)],
    });

    expect(container.textContent).toBe(
      "Extension de places issues des structures BHA-NOR-1 et BHA-NOR-2"
    );
  });

  it("contraction avec une cible (singulier)", () => {
    const { container } = renderLabel({
      kind: "CONTRACTION",
      date: ISO,
      targets: [ref(5)],
    });

    expect(container.textContent).toBe(
      "Contraction de places transférées vers la structure BHA-NOR-5"
    );
  });

  it("fermeture avec motif et cibles", () => {
    renderLabel({
      kind: "FERMETURE",
      date: ISO,
      targets: [ref(8)],
      motif: "Fin de convention",
    });

    expect(screen.getByText("Motif : Fin de convention")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BHA-NOR-8" })).toHaveAttribute(
      "href",
      "/structures/8"
    );
  });

  it("fermeture sans motif ni cibles", () => {
    const { container } = renderLabel({
      kind: "FERMETURE",
      date: ISO,
      targets: [],
      motif: null,
    });

    expect(container.textContent).toBe("Fermeture de la structure");
  });

  it("entrée CPOM avec lien vers la fiche CPOM", () => {
    renderLabel({
      kind: "CPOM_ENTRY",
      date: ISO,
      cpom: { id: 7, operateurName: "Coallia", departements: ["92", "93"] },
    });

    expect(screen.getByRole("link", { name: "Coallia 92, 93" })).toHaveAttribute(
      "href",
      "/cpoms/7"
    );
  });

  it("sortie CPOM", () => {
    const { container } = renderLabel({
      kind: "CPOM_EXIT",
      date: ISO,
      cpom: { id: 7, operateurName: "Coallia", departements: ["92"] },
    });

    expect(container.textContent).toBe("Sortie du CPOM Coallia 92");
  });
});
