import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FiltersDepartement } from "@/app/components/filters/FiltersDepartement";

describe("FiltersDepartement", () => {
  it("ajoute le département cliqué à la sélection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={["35"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Finistère (29)"));

    expect(onChange).toHaveBeenCalledWith(["35", "29"]);
  });

  it("retire le département déjà sélectionné", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={["35"]} onChange={onChange} />);

    await user.click(screen.getByLabelText("Ille-et-Vilaine (35)"));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("sélectionne tous les départements d'une région au clic sur son nom", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={[]} onChange={onChange} />);

    await user.click(screen.getByText("Bretagne"));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining(["22", "29", "35", "56"])
    );
  });

  it("sélectionne la région au clavier depuis sa case", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={[]} onChange={onChange} />);

    screen.getByRole("checkbox", { name: "Bretagne" }).focus();
    await user.keyboard(" ");

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining(["22", "29", "35", "56"])
    );
  });

  it("retire tous les départements d'une région complète sans toucher aux autres", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FiltersDepartement
        departements={["14", "22", "29", "35", "56"]}
        onChange={onChange}
      />
    );

    await user.click(screen.getByText("Bretagne"));

    expect(onChange).toHaveBeenCalledWith(["14"]);
  });

  it("filtre les départements selon la recherche (insensible aux accents et majuscules)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={[]} onChange={onChange} />);

    const searchInput = screen.getByRole("searchbox", {
      name: "Rechercher une région, un département",
    });

    await user.type(searchInput, "finistere");

    expect(screen.getByLabelText("Finistère (29)")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Ille-et-Vilaine (35)")
    ).not.toBeInTheDocument();
  });

  it("affiche un message d'absence de résultat lorsque la recherche ne correspond à rien", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FiltersDepartement departements={[]} onChange={onChange} />);

    const searchInput = screen.getByRole("searchbox", {
      name: "Rechercher une région, un département",
    });

    await user.type(searchInput, "RechercheInexistante123");

    expect(
      screen.getByText(
        "Aucun département ou région ne correspond à votre recherche."
      )
    ).toBeInTheDocument();
  });
});
