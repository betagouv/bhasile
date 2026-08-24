import { render, screen, within } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";

import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { StructureType } from "@/generated/prisma/client";
import { Repartition } from "@/types/adresse.type";
import { StructureListItem } from "@/types/structure-list.type";

import { StructuresTable } from "../../../src/app/(authenticated)/(with-menu)/structures/_components/StructuresTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("page=0"),
}));

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: vi.fn() }),
}));

vi.mock("next-auth/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth/react")>();
  return {
    ...actual,
    SessionProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useSession: vi.fn(() => ({
      data: {
        expires: "1",
        user: { email: "test@example.com", name: "John Doe", role: "NATIONAL" },
      },
      status: "authenticated",
    })),
  };
});

describe("StructuresTable", () => {
  it("affiche les en-têtes de colonnes et le contenu des lignes au rendu", () => {
    // GIVEN
    const structures = [1, 2, 3].map((id) => buildListItem(id));
    const ariaLabelledBy = "";

    // WHEN
    render(
      <SessionProvider>
        <AppAbilityProvider>
          <StructuresTable
            structures={structures}
            totalStructures={structures.length}
            ariaLabelledBy={ariaLabelledBy}
            isClosed={false}
          />
        </AppAbilityProvider>
      </SessionProvider>
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

const buildListItem = (id: number): StructureListItem => ({
  id,
  codeBhasile: `BHA-${id}`,
  type: StructureType.CADA,
  operateurLabel: "Adoma",
  departementAdministratif: "75",
  bati: Repartition.DIFFUS,
  placesAutorisees: 10,
  finConvention: "2027-01-02T12:00:00.000Z",
  isFinalised: false,
  isClosed: false,
  communes: [{ name: "Paris", placesAutorisees: 10 }],
});
