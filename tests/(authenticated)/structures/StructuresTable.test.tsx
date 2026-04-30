import { render, screen, within } from "@testing-library/react";

import { StructureApiRead } from "@/schemas/api/structure.schema";

import { StructuresTable } from "../../../src/app/(authenticated)/structures/_components/StructuresTable";
import { createAdresse } from "../../test-utils/factories/adresse.factory";
import { createStructureTypologie } from "../../test-utils/factories/structure-typologie.factory";
import { createStructure } from "../../test-utils/structure.factory";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("page=0"),
}));

describe("StructuresTable", () => {
  it("should show table headings and content elements when rendered", () => {
    // GIVEN
    const adresse1 = createAdresse({});
    const adresse2 = createAdresse({});
    const adresse3 = createAdresse({});
    const structureTypologies1 = [createStructureTypologie()];
    const structureTypologies2 = [createStructureTypologie()];
    const structureTypologies3 = [createStructureTypologie()];
    const structure1 = createStructure({
      id: 1,
      structureTypologies: structureTypologies1,
    });
    const structure2 = createStructure({
      id: 2,
      structureTypologies: structureTypologies2,
    });
    const structure3 = createStructure({
      id: 3,
      structureTypologies: structureTypologies3,
    });
    structure1.adresses = [adresse1];
    structure2.adresses = [adresse2];
    structure3.adresses = [adresse3];
    const structures: StructureApiRead[] = [structure1, structure2, structure3];
    const ariaLabelledBy = "";

    // WHEN
    render(
      <StructuresTable
        structures={structures}
        totalStructures={structures.length}
        ariaLabelledBy={ariaLabelledBy}
      />
    );

    // THEN
    const rows = screen.getAllByRole("rowgroup");
    const columnHeaders = within(rows[0]).getAllByRole("columnheader");
    expect(columnHeaders[0]).toHaveAccessibleName("Code");
    expect(columnHeaders[1]).toHaveAccessibleName("Type");
    expect(columnHeaders[2]).toHaveAccessibleName("Opérateur");
    expect(columnHeaders[3]).toHaveAccessibleName("Dépt.");
    expect(columnHeaders[4]).toHaveAccessibleName("Communes");
    expect(columnHeaders[5]).toHaveAccessibleName("Bâti");
    expect(columnHeaders[6]).toHaveAccessibleName("Places aut.");
    expect(columnHeaders[7]).toHaveAccessibleName("Fin convention");
    expect(columnHeaders[8]).toHaveAccessibleName("");
    const structureRows = screen.getAllByRole("row");
    const firstStructureCells = within(structureRows[1]).getAllByRole("cell");
    expect(firstStructureCells[0]).toHaveAccessibleName("BHA-1");
    expect(firstStructureCells[1]).toHaveAccessibleName("CADA");
    expect(firstStructureCells[2]).toHaveAccessibleName("Adoma");
    expect(firstStructureCells[3]).toHaveAccessibleName("75");
    expect(firstStructureCells[4]).toHaveAccessibleName("Paris");
    expect(firstStructureCells[5]).toHaveAccessibleName("Diffus");
    expect(firstStructureCells[6]).toHaveAccessibleName("10");
    expect(firstStructureCells[7]).toHaveAccessibleName("02/01/2027");
    const firstStructureButtonCell = firstStructureCells[8];
    const firstStructureButton = within(firstStructureButtonCell).getByRole(
      "button",
      {
        name: "Finaliser la création de la structure BHA-1",
      }
    );
    expect(firstStructureButton).toBeInTheDocument();
    const secondStructureCells = within(structureRows[2]).getAllByRole("cell");
    expect(secondStructureCells[0]).toHaveAccessibleName("BHA-2");
    expect(secondStructureCells[1]).toHaveAccessibleName("CADA");
    expect(secondStructureCells[2]).toHaveAccessibleName("Adoma");
    expect(secondStructureCells[3]).toHaveAccessibleName("75");
    expect(secondStructureCells[4]).toHaveAccessibleName("Paris");
    expect(secondStructureCells[5]).toHaveAccessibleName("Diffus");
    expect(secondStructureCells[6]).toHaveAccessibleName("10");
    expect(secondStructureCells[7]).toHaveAccessibleName("02/01/2027");
    const secondStructureButtonCell = secondStructureCells[8];
    const secondStructureButton = within(secondStructureButtonCell).getByRole(
      "button",
      {
        name: "Finaliser la création de la structure BHA-2",
      }
    );
    expect(secondStructureButton).toBeInTheDocument();
    const thirdStructureCells = within(structureRows[3]).getAllByRole("cell");
    expect(thirdStructureCells[0]).toHaveAccessibleName("BHA-3");
    expect(thirdStructureCells[1]).toHaveAccessibleName("CADA");
    expect(thirdStructureCells[2]).toHaveAccessibleName("Adoma");
    expect(thirdStructureCells[3]).toHaveAccessibleName("75");
    expect(thirdStructureCells[4]).toHaveAccessibleName("Paris");
    expect(thirdStructureCells[5]).toHaveAccessibleName("Diffus");
    expect(thirdStructureCells[6]).toHaveAccessibleName("10");
    expect(thirdStructureCells[7]).toHaveAccessibleName("02/01/2027");
    const thirdStructureButtonCell = thirdStructureCells[8];
    const thirdStructureButton = within(thirdStructureButtonCell).getByRole(
      "button",
      {
        name: "Finaliser la création de la structure BHA-3",
      }
    );
    expect(thirdStructureButton).toBeInTheDocument();
    const pagination = screen.getByRole("navigation");
    const pages = within(pagination).getAllByRole("link");
    expect(pages[0]).toHaveAccessibleName("Première page");
    expect(pages[1]).toHaveAccessibleName("Page précédente");
    expect(pages[2]).toHaveAccessibleName("Page 1/1");
    expect(pages[3]).toHaveAccessibleName("Page suivante");
    expect(pages[4]).toHaveAccessibleName("Dernière page");
  });
});
