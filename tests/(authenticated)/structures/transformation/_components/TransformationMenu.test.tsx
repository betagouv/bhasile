import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationMenu } from "@/app/(authenticated)/structures/transformation/_components/TransformationMenu";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockUsePathname = vi.fn<() => string>();
const mockRouterPush = vi.fn();
const mockUseOptionalTransformationContext =
  vi.fn<() => { transformation: TransformationApiRead | null }>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("next-auth/react");

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useOptionalTransformationContext: () =>
      mockUseOptionalTransformationContext(),
  })
);

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({ getFetchState: () => FetchState.IDLE }),
}));

describe("TransformationMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOptionalTransformationContext.mockReturnValue({
      transformation: null,
    });
  });

  describe("when there is no transformationId", () => {

    it("should mark 'Cas de figure' as active on /type pathname", () => {
      // GIVEN
      mockUsePathname.mockReturnValue("/structures/transformation/type");

      // WHEN
      render(<TransformationMenu />);

      // THEN
      const casDeFigure = screen.getByRole("button", {
        name: /Cas de figure/,
      });
      expect(casDeFigure).toHaveAttribute("aria-current", "page");
    });

    it("should disable 'Saisie des données' and 'Vérification'", () => {
      // GIVEN
      mockUsePathname.mockReturnValue("/structures/transformation/type");

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.getByRole("button", { name: /Saisie des données/ })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: /Vérification/ })
      ).toBeDisabled();
    });

    it("should navigate to /type when clicking 'Cas de figure'", async () => {
      // GIVEN
      mockUsePathname.mockReturnValue("/structures/transformation/type");
      const user = userEvent.setup();
      render(<TransformationMenu />);

      // WHEN
      await user.click(screen.getByRole("button", { name: /Cas de figure/ }));

      // THEN
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/type"
      );
    });

    it("should not render any transformation step when no transformation is loaded", () => {
      // GIVEN
      mockUsePathname.mockReturnValue("/structures/transformation/type");

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.queryByRole("link", { name: "Description" })
      ).not.toBeInTheDocument();
    });
  });

  describe("when there is a transformationId", () => {
    beforeEach(() => {
      mockUseOptionalTransformationContext.mockReturnValue({
        transformation: {
          id: 42,
          type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
          structureVersionTransformations: [],
        },
      });
    });

    it("should mark 'Cas de figure' as active on /selection pathname", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );

      // WHEN
      render(<TransformationMenu />);

      // THEN
      const casDeFigure = screen.getByRole("button", {
        name: /Cas de figure/,
      });
      expect(casDeFigure).toHaveAttribute("aria-current", "page");
    });

    it("should mark 'Saisie des données' as active on a /contraction pathname", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/contraction/1/description"
      );

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.getByRole("button", { name: /Saisie des données/ })
      ).toHaveAttribute("aria-current", "page");
    });

    it.each([
      ["/structures/transformation/42/extension/1/description"],
      ["/structures/transformation/42/ouverture/1/description"],
      ["/structures/transformation/42/fermeture/1/description"],
    ])(
      "should mark 'Saisie des données' as active on %s",
      (pathname: string) => {
        // GIVEN
        mockUsePathname.mockReturnValue(pathname);

        // WHEN
        render(<TransformationMenu />);

        // THEN
        expect(
          screen.getByRole("button", { name: /Saisie des données/ })
        ).toHaveAttribute("aria-current", "page");
      }
    );

    it("should mark 'Vérification' as active on /verification pathname", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/verification"
      );

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.getByRole("button", { name: /Vérification/ })
      ).toHaveAttribute("aria-current", "page");
    });

    it("should keep 'Saisie des données' disabled even with a transformationId", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.getByRole("button", { name: /Saisie des données/ })
      ).toBeDisabled();
    });

    it("should enable 'Vérification' when a transformationId is provided", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(
        screen.getByRole("button", { name: /Vérification/ })
      ).toBeEnabled();
    });

    it("should navigate to /selection when clicking 'Cas de figure'", async () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );
      const user = userEvent.setup();
      render(<TransformationMenu />);

      // WHEN
      await user.click(screen.getByRole("button", { name: /Cas de figure/ }));

      // THEN
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/42/selection"
      );
    });

    it("should navigate to /verification when clicking 'Vérification'", async () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );
      const user = userEvent.setup();
      render(<TransformationMenu />);

      // WHEN
      await user.click(screen.getByRole("button", { name: /Vérification/ }));

      // THEN
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/42/verification"
      );
    });

    it("should render the substeps of the loaded transformation", () => {
      // GIVEN
      mockUsePathname.mockReturnValue(
        "/structures/transformation/42/selection"
      );
      mockUseOptionalTransformationContext.mockReturnValue({
        transformation: {
          id: 42,
          type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
          structureVersionTransformations: [
            {
              id: 1,
              type: StructureVersionTransformationType.FERMETURE,
              structureVersion: {
                structureId: 1001,
                structure: { codeBhasile: "1001" },
              },
            },
          ],
        },
      });

      // WHEN
      render(<TransformationMenu />);

      // THEN
      expect(screen.getByText("Fermeture 1001")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Description" })
      ).toBeInTheDocument();
    });
  });
});
