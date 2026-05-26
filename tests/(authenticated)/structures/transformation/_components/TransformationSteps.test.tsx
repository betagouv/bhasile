import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationSteps } from "@/app/(authenticated)/structures/transformation/_components/TransformationSteps";
import { StructureTransformationType } from "@/types/transformation.type";

import { createTransformation } from "../../../../test-utils/factories/transformation.factory";

const mockUsePathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("TransformationSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("should render nothing when there is no transformation", () => {
    // WHEN
    const { container } = render(<TransformationSteps transformation={null} />);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });

  it("should render every structureTransformation as a step group", () => {
    // GIVEN
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 1,
        type: StructureTransformationType.FERMETURE,
        structureVersion: { structureId: 1001, structure: { codeBhasile: "1001" } },
      },
      {
        id: 2,
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
      {
        id: 3,
        type: StructureTransformationType.CREATION,
        structureVersion: { structureId: 1003, structure: { codeBhasile: "1003" } },
      },
    ] });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

    // THEN
    expect(screen.getByText("Fermeture 1001")).toBeInTheDocument();
    expect(screen.getByText("Extension 1002")).toBeInTheDocument();
    expect(screen.getByText("Nouvelle structure")).toBeInTheDocument();
  });

  it("should sort steps in the order Fermeture, Contraction, Extension, Création", () => {
    // GIVEN
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 1,
        type: StructureTransformationType.CREATION,
        structureVersion: { structureId: 1001, structure: { codeBhasile: "1001" } },
      },
      {
        id: 2,
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
      {
        id: 3,
        type: StructureTransformationType.FERMETURE,
        structureVersion: { structureId: 1003, structure: { codeBhasile: "1003" } },
      },
      {
        id: 4,
        type: StructureTransformationType.CONTRACTION,
        structureVersion: { structureId: 1004, structure: { codeBhasile: "1004" } },
      },
    ] });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

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
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 7,
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
    ] });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

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
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 9,
        type: StructureTransformationType.FERMETURE,
        structureVersion: { structureId: 1001, structure: { codeBhasile: "1001" } },
      },
    ] });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

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
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 7,
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
    ] });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

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
    const transformation = createTransformation({ structureTransformations: [
      {
        id: 7,
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
    ] });

    // WHEN
    const { container } = render(
      <TransformationSteps transformation={transformation} />
    );

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
      const transformation = createTransformation({ structureTransformations: [
        {
          id: 7,
          type: type,
          structureVersion: {
            structureId: 1002,
            structure: { codeBhasile: "1002" },
          },
        },
      ] });

      // WHEN
      render(<TransformationSteps transformation={transformation} />);

      // THEN
      expect(screen.getByRole("link", { name: "Description" })).toHaveAttribute(
        "href",
        `/structures/transformation/42/${segment}/7/description`
      );
    }
  );
});

