import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import { createSessionUser } from "tests/test-utils/factories/session-user.factory";
import { createSessionGrant } from "tests/test-utils/factories/session-user.factory";
import { createStructure } from "tests/test-utils/structure.factory";
import { renderWithStructurePageProviders } from "tests/test-utils/structure-page-test.helpers";
import { describe, expect, it } from "vitest";

import { CpomViewer } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_description/CpomViewer";
import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { AccessRole } from "@/generated/prisma/client";
import { StructureApiRead } from "@/schemas/api/structure.schema";

const operateurUser = createSessionUser({
  operateurId: 1,
  isAgent: false,
  grants: [
    createSessionGrant({
      role: AccessRole.LECTEUR,
      departementNumeros: ["92"],
    }),
  ],
});

describe("CpomViewer", () => {
  it("ne propose la fiche que des structures finalisées que l'utilisateur peut lire", async () => {
    renderViewer([
      linkedStructure({
        id: 1,
        codeBhasile: "BHA-1",
        departementAdministratif: "92",
      }),
      linkedStructure({
        id: 2,
        codeBhasile: "BHA-2",
        departementAdministratif: "92",
        isFinalised: false,
      }),
      linkedStructure({
        id: 3,
        codeBhasile: "BHA-3",
        departementAdministratif: "75",
      }),
    ]);

    await userEvent.click(
      screen.getByRole("button", { name: "Voir le détail" })
    );

    expect(screen.getByText("BHA-2")).toBeInTheDocument();
    expect(screen.getByText("BHA-3")).toBeInTheDocument();
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
  departementAdministratif,
  isFinalised = true,
}: {
  id: number;
  codeBhasile: string;
  departementAdministratif: string;
  isFinalised?: boolean;
}) => ({
  id,
  structureId: id,
  structure: {
    id,
    codeBhasile,
    type: "CADA",
    communeAdministrative: "Nanterre",
    departementAdministratif,
    operateurId: 1,
    operateur: { name: "Opérateur 1" },
    forms: [],
    isFinalised,
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
    <SessionProvider
      session={{ user: operateurUser, expires: "2999-12-31T00:00:00.000Z" }}
    >
      <AppAbilityProvider>
        <CpomViewer />
      </AppAbilityProvider>
    </SessionProvider>
  );
