import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommunePopupContent } from "@/app/components/map/CommunePopupContent";
import { StructureType } from "@/types/structure.type";
import { CommuneMapPoint } from "@/types/structure-list.type";

const SAINT_LO: CommuneMapPoint = {
  key: "49.1138|-1.0801",
  latitude: 49.1138,
  longitude: -1.0801,
  nom: "Saint-Lô",
  places: 3,
  structures: [
    {
      id: 23,
      nom: "Les Mimosas",
      codeBhasile: "BHA-NOR-023",
      type: StructureType.CADA,
      operateurLabel: "ADOMA",
      places: 2,
      isFinalised: true,
    },
    {
      id: 31,
      nom: null,
      codeBhasile: "BHA-NOR-031",
      type: StructureType.HUDA,
      operateurLabel: "YSOS",
      places: 1,
      isFinalised: false,
    },
  ],
};

describe("CommunePopupContent", () => {
  it("titre la popup par le nom officiel de la commune", () => {
    render(<CommunePopupContent commune={SAINT_LO} />);

    expect(screen.getByText("Saint-Lô")).toBeInTheDocument();
  });

  it("liste chaque structure avec son code, son type, son opérateur et ses places dans la commune", () => {
    render(<CommunePopupContent commune={SAINT_LO} />);

    expect(screen.getByText("Les Mimosas")).toBeInTheDocument();
    expect(screen.getByText("BHA-NOR-023 – CADA, ADOMA")).toBeInTheDocument();
    expect(screen.getByText("2 places")).toBeInTheDocument();
    expect(screen.getByText("1 place")).toBeInTheDocument();
  });

  it("affiche le code Bhasile quand la structure n'a pas de nom", () => {
    render(<CommunePopupContent commune={SAINT_LO} />);

    expect(screen.getAllByText("BHA-NOR-031")[0]).toBeInTheDocument();
  });

  it("mène à la fiche d'une structure finalisée et à la finalisation sinon", () => {
    render(<CommunePopupContent commune={SAINT_LO} />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/structures/23");
    expect(links[1]).toHaveAttribute(
      "href",
      "/structures/31/finalisation/01-identification"
    );
  });
});
