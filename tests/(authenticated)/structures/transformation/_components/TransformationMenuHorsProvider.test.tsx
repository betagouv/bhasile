import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationMenu } from "@/app/(authenticated)/structures/transformation/_components/TransformationMenu";
import { FetchState } from "@/types/fetch-state.type";

const mockUsePathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react");

vi.mock("@/contexts/FetchStateContext", () => ({
  useFetchState: () => ({ getFetchState: () => FetchState.IDLE }),
}));

// Contrairement à TransformationMenu.test.tsx, ce fichier ne mocke PAS
// @/contexts/TransformationContext : il monte le vrai hook hors provider, ce qui est
// exactement la situation de /structures/transformation/type.
describe("TransformationMenu hors provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/structures/transformation/type");
  });

  it("s'affiche quand aucun TransformationProvider n'est monté", () => {
    // WHEN
    render(<TransformationMenu />);

    // THEN
    expect(screen.getByRole("button", { name: /Cas de figure/ })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("button", { name: /Vérification/ })).toBeDisabled();
  });
});
