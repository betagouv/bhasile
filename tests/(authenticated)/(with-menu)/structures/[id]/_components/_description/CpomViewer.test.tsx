import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { describe, expect, it } from "vitest";

import { CpomViewer } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/CpomViewer";
import { StructureApiRead } from "@/schemas/api/structure.schema";

describe("CpomViewer", () => {
  it("liste toutes les structures du CPOM et ne lie que celles dont la fiche est lisible", async () => {
    renderViewer([
      linkedStructure({ id: 1, codeBhasile: "BHA-1" }),
      linkedStructure({ id: 2, codeBhasile: "BHA-2", canRead: false }),
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: "Voir le détail" })
    );

    expect(screen.getByText("BHA-2")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href"))
    ).toEqual(["/structures/1"]);
  });

  it("ne monte qu'une pop-in de droits insuffisants quand la fiche est aussi rendue pour l'export PDF", async () => {
    renderViewer(
      [
        linkedStructure({
          id: 7,
          codeBhasile: "BHA-7",
          isFinalised: false,
          canUpdate: false,
        }),
      ],
      <>
        <section data-testid="ecran">
          <CpomViewer />
        </section>
        <section data-testid="export-pdf">
          <CpomViewer />
        </section>
      </>
    );

    await userEvent.click(
      within(screen.getByTestId("ecran")).getByRole("button", {
        name: "Voir le détail",
      })
    );

    const dialogs = screen.getAllByRole("dialog", { hidden: true });
    expect(dialogs).toHaveLength(1);
    expect(
      within(screen.getByTestId("ecran")).getByRole("dialog", { hidden: true })
    ).toBe(dialogs[0]);
  });
});

const linkedStructure = ({
  id,
  codeBhasile,
  isFinalised = true,
  canRead = true,
  canUpdate = true,
}: {
  id: number;
  codeBhasile: string;
  isFinalised?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
}) => ({
  id,
  structureId: id,
  structure: {
    id,
    codeBhasile,
    type: "CADA",
    communeAdministrative: "Nanterre",
    operateur: { name: "Opérateur 1" },
    isFinalised,
    isClosed: false,
    isVisible: true,
    canRead,
    canUpdate,
  },
});

const renderViewer = (
  structures: ReturnType<typeof linkedStructure>[],
  page: React.ReactElement = <CpomViewer />
) =>
  renderWithStructurePageProviders(
    {
      ...createStructure({ id: 42 }),
      isInCpom: true,
      cpomStructures: [
        {
          id: 1,
          cpom: {
            id: 7,
            dateStart: "2000-01-01T00:00:00.000Z",
            dateEnd: "2999-12-31T00:00:00.000Z",
            structures,
          },
        },
      ],
    } as unknown as StructureApiRead,
    page
  );
