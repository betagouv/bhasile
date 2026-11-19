import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { describe, expect, it, vi } from "vitest";

import { CpomViewer } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/CpomViewer";
import { CpomStructureApiRead } from "@/schemas/api/cpom.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { StructureType } from "@/types/structure.type";

vi.mock("@/app/hooks/useCanUpdateStructure", () => ({
  useCanReadStructures: () => () => true,
  useCanUpdateStructures: () => () => false,
}));

const cpomStructure = {
  structureId: 42,
  cpom: {
    id: 1,
    dateStart: "2000-01-01T12:00:00.000Z",
    dateEnd: "2999-12-31T12:00:00.000Z",
    structures: [
      {
        id: 10,
        structureId: 7,
        structure: {
          id: 7,
          codeBhasile: "BHA-7",
          type: StructureType.CADA,
          communeAdministrative: "Rennes",
          departementAdministratif: "35",
          operateur: { id: 3, name: "Opérateur" },
          isFinalised: false,
          isClosed: false,
          isVisible: true,
        },
      },
    ],
  },
} as unknown as CpomStructureApiRead;

const structure: StructureApiRead = {
  ...createStructure({ id: 42, cpomStructures: [cpomStructure] }),
  isInCpom: true,
};

describe("CpomViewer", () => {
  it("ne monte qu'une pop-in de droits insuffisants quand la fiche est aussi rendue pour l'export PDF", async () => {
    renderWithStructurePageProviders(
      structure,
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
