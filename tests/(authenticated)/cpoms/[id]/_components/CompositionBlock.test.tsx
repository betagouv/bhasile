import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompositionBlock } from "@/app/(authenticated)/(with-menu)/cpoms/[id]/_components/CompositionBlock";
import { AppAbilityProvider } from "@/contexts/AbilityProvider";
import { CpomProvider } from "@/contexts/CpomContext";
import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

const mockCanRead = vi.fn();
const mockCanUpdate = vi.fn();
const mockOpenNoPermissionsModal = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next-auth/react")>()),
  useSession: () => ({
    data: { expires: "1", user: { name: "Agent", role: "NATIONAL" } },
    status: "authenticated",
  }),
}));

vi.mock("@/app/hooks/useCanUpdateStructure", () => ({
  useCanReadStructures: () => mockCanRead,
  useCanUpdateStructures: () => mockCanUpdate,
}));

vi.mock("@/components/NoPermissionsModal", () => ({
  NoPermissionsModal: () => null,
  openNoPermissionsModal: () => mockOpenNoPermissionsModal(),
}));

type LinkedStructure = NonNullable<
  NonNullable<CpomApiRead["structures"]>[number]["structure"]
>;

const renderComposition = (overrides: Partial<LinkedStructure>) => {
  const cpom = {
    id: 1,
    dateStart: "2024-01-01T12:00:00.000Z",
    dateEnd: "2028-12-31T12:00:00.000Z",
    structures: [
      {
        id: 10,
        cpomId: 1,
        structureId: 42,
        structure: {
          id: 42,
          codeBhasile: "BHA-42",
          type: StructureType.CADA,
          communeAdministrative: "Nancy",
          departementAdministratif: "54",
          operateur: { id: 3, name: "Opérateur" },
          isFinalised: true,
          isClosed: false,
          isVisible: true,
          ...overrides,
        },
      },
    ],
  } as unknown as CpomApiRead;

  render(
    <AppAbilityProvider>
      <CpomProvider entity={cpom}>
        <CompositionBlock />
      </CpomProvider>
    </AppAbilityProvider>
  );

  return within(screen.getByRole("table"));
};

describe("CompositionBlock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanRead.mockReturnValue(true);
    mockCanUpdate.mockReturnValue(true);
  });

  it("affiche une flèche vers la fiche d'une structure finalisée lisible", () => {
    const table = renderComposition({ isFinalised: true });

    const link = table.getByRole("link", {
      name: "Voir la structure BHA-42",
    });
    expect(link).toHaveAttribute("href", "/structures/42");
    expect(link).toHaveClass("fr-icon-arrow-right-line");
  });

  it("n'affiche pas de flèche sans droit de lecture", () => {
    mockCanRead.mockReturnValue(false);

    const table = renderComposition({ isFinalised: true });

    expect(table.queryByRole("link")).not.toBeInTheDocument();
    expect(table.queryByRole("button")).not.toBeInTheDocument();
  });

  it("affiche une icône d'édition vers la finalisation d'une structure visible non finalisée", () => {
    const table = renderComposition({ isFinalised: false });

    const link = table.getByRole("link", {
      name: "Finaliser la création de la structure BHA-42",
    });
    expect(link).toHaveAttribute(
      "href",
      "/structures/42/finalisation/01-identification"
    );
    expect(link).toHaveClass("fr-icon-edit-line");
  });

  it("ouvre la pop-in de droits insuffisants pour une structure non finalisée sans droit de modification", async () => {
    mockCanUpdate.mockReturnValue(false);

    const table = renderComposition({ isFinalised: false });

    expect(table.queryByRole("link")).not.toBeInTheDocument();
    await userEvent.click(
      table.getByRole("button", {
        name: "Finaliser la création de la structure BHA-42",
      })
    );
    expect(mockOpenNoPermissionsModal).toHaveBeenCalledOnce();
  });

  it("n'affiche aucune action pour une structure non visible", () => {
    const table = renderComposition({ isFinalised: false, isVisible: false });

    expect(table.queryByRole("link")).not.toBeInTheDocument();
    expect(table.queryByRole("button")).not.toBeInTheDocument();
  });
});
