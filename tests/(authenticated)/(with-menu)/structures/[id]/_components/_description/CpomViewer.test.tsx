import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { describe, expect, it } from "vitest";

import { CpomViewer } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/CpomViewer";
import { StructureApiRead } from "@/schemas/api/structure.schema";

describe("CpomViewer", () => {
  it("liste toutes les structures du CPOM et ne lie que celles où isLinkable est vrai", async () => {
    renderViewer([
      linkedStructure({ id: 1, codeBhasile: "BHA-1", isLinkable: true }),
      linkedStructure({ id: 2, codeBhasile: "BHA-2", isLinkable: false }),
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: "Voir le détail" })
    );

    expect(screen.getByText("BHA-2")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "Voir la structure" })
        .map((link) => link.getAttribute("href"))
    ).toEqual(["/structures/1"]);
  });
});

const linkedStructure = ({
  id,
  codeBhasile,
  isLinkable,
}: {
  id: number;
  codeBhasile: string;
  isLinkable: boolean;
}) => ({
  id,
  structureId: id,
  structure: {
    id,
    codeBhasile,
    type: "CADA",
    communeAdministrative: "Nanterre",
    operateur: { name: "Opérateur 1" },
    isLinkable,
  },
});

const renderViewer = (structures: ReturnType<typeof linkedStructure>[]) =>
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
    <CpomViewer />
  );
