import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import { createDepartementalAgent } from "tests/test-utils/factories/session-user.factory";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { describe, expect, it, vi } from "vitest";

import { StructureMenu } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_header/StructureMenu";
import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { SessionUser } from "@/types/global";

vi.mock("@/app/hooks/usePdfExport", () => ({
  usePdfExport: () => ({
    triggerExport: vi.fn(),
    isExporting: false,
    printRef: { current: null },
  }),
}));

vi.mock("@/app/hooks/useUserAction", () => ({
  useUserAction: () => ({
    trackStructureSpreadsheetExport: vi.fn(),
    trackStructurePdfExport: vi.fn(),
  }),
}));

vi.mock(
  "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_header/StructurePdfExportDocument",
  () => ({ StructurePdfExportDocument: () => null })
);

describe("StructureMenu", () => {
  it("propose les transformations à un agent qui peut modifier la structure", async () => {
    await renderMenu(createDepartementalAgent(["75"]));

    expect(
      screen.getByRole("link", { name: "Extension, contraction ou fermeture" })
    ).toHaveAttribute("href", "/structures/transformation/type?structureId=42");
  });

  it("masque les transformations à un agent qui ne peut pas modifier la structure", async () => {
    await renderMenu(createDepartementalAgent(["92"]));

    expect(
      screen.queryByRole("link", {
        name: "Extension, contraction ou fermeture",
      })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Exporter la fiche (PDF)")).toBeInTheDocument();
  });
});

const renderMenu = async (user: SessionUser) => {
  renderWithStructurePageProviders(
    createStructure({ id: 42 }),
    <SessionProvider session={{ user, expires: "2999-12-31T00:00:00.000Z" }}>
      <AppAbilityProvider>
        <StructureMenu structureId={42} />
      </AppAbilityProvider>
    </SessionProvider>
  );
  await userEvent.click(screen.getByTitle("Menu structure"));
};
