import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationSteps } from "@/app/(authenticated)/structures/transformation/_components/TransformationSteps";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockUsePathname = vi.fn<() => string>();
const mockUseFetchTransformation =
  vi.fn<() => { transformation: TransformationApiRead | undefined }>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/app/hooks/useFetchTransformation", () => ({
  useFetchTransformation: () => mockUseFetchTransformation(),
}));

describe("TransformationSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("should render nothing when there is no transformation", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({ transformation: undefined });

    // WHEN
    const { container } = render(<TransformationSteps transformationId={42} />);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });

  it("should render every structureTransformation as a step group", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 1,
          structureId: 1001,
          type: StructureTransformationType.FERMETURE,
        },
        {
          id: 2,
          structureId: 1002,
          type: StructureTransformationType.EXTENSION,
        },
        {
          id: 3,
          structureId: 1003,
          type: StructureTransformationType.CREATION,
        },
      ]),
    });

    // WHEN
    render(<TransformationSteps transformationId={42} />);

    // THEN
    expect(screen.getByText("Fermeture 1001")).toBeInTheDocument();
    expect(screen.getByText("Extension 1002")).toBeInTheDocument();
    expect(screen.getByText("Nouvelle structure")).toBeInTheDocument();
  });

  it("should sort steps in the order Fermeture, Contraction, Extension, Création", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 1,
          structureId: 1001,
          type: StructureTransformationType.CREATION,
        },
        {
          id: 2,
          structureId: 1002,
          type: StructureTransformationType.EXTENSION,
        },
        {
          id: 3,
          structureId: 1003,
          type: StructureTransformationType.FERMETURE,
        },
        {
          id: 4,
          structureId: 1004,
          type: StructureTransformationType.CONTRACTION,
        },
      ]),
    });

    // WHEN
    render(<TransformationSteps transformationId={42} />);

    // THEN
    const labels = screen
      .getAllByText(/Fermeture|Contraction|Extension|Nouvelle structure/)
      .map((el) => el.textContent);
    expect(labels).toEqual([
      "Fermeture 1003",
      "Contraction 1004",
      "Extension 1002",
      "Nouvelle structure",
    ]);
  });

  it("should render the three substeps for an EXTENSION step", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 7,
          structureId: 1002,
          type: StructureTransformationType.EXTENSION,
        },
      ]),
    });

    // WHEN
    render(<TransformationSteps transformationId={42} />);

    // THEN
    expect(
      screen.getByRole("link", { name: "Description" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Places et hébergement" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Actes administratifs" })
    ).toBeInTheDocument();
  });

  it("should only render the Description substep for a FERMETURE step", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 9,
          structureId: 1001,
          type: StructureTransformationType.FERMETURE,
        },
      ]),
    });

    // WHEN
    render(<TransformationSteps transformationId={42} />);

    // THEN
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName("Description");
  });

  it("should mark the substep matching the current pathname as the current page", () => {
    // GIVEN
    mockUsePathname.mockReturnValue(
      "/structures/transformation/42/extension/7/places-et-hebergement"
    );
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 7,
          structureId: 1002,
          type: StructureTransformationType.EXTENSION,
        },
      ]),
    });

    // WHEN
    render(<TransformationSteps transformationId={42} />);

    // THEN
    const placesLink = screen.getByRole("link", {
      name: "Places et hébergement",
    });
    expect(placesLink).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Description" })
    ).not.toHaveAttribute("aria-current");
  });

  it("should build hrefs for each substep based on the transformation and step ids", () => {
    // GIVEN
    mockUseFetchTransformation.mockReturnValue({
      transformation: buildTransformation([
        {
          id: 7,
          structureId: 1002,
          type: StructureTransformationType.EXTENSION,
        },
      ]),
    });

    // WHEN
    const { container } = render(<TransformationSteps transformationId={42} />);

    // THEN
    const links = within(container).getAllByRole("link");
    expect(links[0]).toHaveAttribute(
      "href",
      "/structures/transformation/42/extension/7/description"
    );
    expect(links[1]).toHaveAttribute(
      "href",
      "/structures/transformation/42/extension/7/places-et-hebergement"
    );
    expect(links[2]).toHaveAttribute(
      "href",
      "/structures/transformation/42/extension/7/actes-administratifs"
    );
  });

  it.each([
    [StructureTransformationType.EXTENSION, "extension"],
    [StructureTransformationType.CONTRACTION, "contraction"],
    [StructureTransformationType.FERMETURE, "fermeture"],
    [StructureTransformationType.CREATION, "creation"],
  ])(
    "should use the segment matching a %s type in hrefs",
    (type: StructureTransformationType, segment: string) => {
      // GIVEN
      mockUseFetchTransformation.mockReturnValue({
        transformation: buildTransformation([
          { id: 7, structureId: 1002, type },
        ]),
      });

      // WHEN
      render(<TransformationSteps transformationId={42} />);

      // THEN
      expect(screen.getByRole("link", { name: "Description" })).toHaveAttribute(
        "href",
        `/structures/transformation/42/${segment}/7/description`
      );
    }
  );
});

const buildTransformation = (
  structureTransformations: TransformationApiRead["structureTransformations"]
): TransformationApiRead => ({
  id: 42,
  type: TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
  structureTransformations,
});
