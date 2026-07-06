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

    it("marque 'Cas de figure' comme actif sur le pathname /type", () => {
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

    it("désactive 'Saisie des données' et 'Vérification'", () => {
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

    it("navigue vers /type au clic sur 'Cas de figure'", async () => {
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

    it("n'affiche aucune étape de transformation quand aucune transformation n'est chargée", () => {
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

    it("marque 'Cas de figure' comme actif sur le pathname /selection", () => {
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

    it("marque 'Saisie des données' comme actif sur un pathname /contraction", () => {
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
      "marque 'Saisie des données' comme actif sur %s",
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

    it("marque 'Vérification' comme actif sur le pathname /verification", () => {
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

    it("garde 'Saisie des données' désactivé même avec un transformationId", () => {
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

    it("active 'Vérification' quand un transformationId est fourni", () => {
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

    it("navigue vers /selection au clic sur 'Cas de figure'", async () => {
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

    it("navigue vers /verification au clic sur 'Vérification'", async () => {
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

    it("affiche les sous-étapes de la transformation chargée", () => {
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
