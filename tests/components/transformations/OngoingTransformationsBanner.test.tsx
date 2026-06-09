import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import { OngoingTransformationsBanner } from "@/app/components/transformations/OngoingTransformationsBanner";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";

import {
  createStructureVersionTransformation,
  createTransformation,
} from "../../test-utils/factories/transformation.factory";

const mockUseOngoingTransformations = vi.fn<
  () => { transformations: TransformationApiRead[] }
>();

vi.mock("@/app/hooks/useOngoingTransformations", () => ({
  useOngoingTransformations: () => mockUseOngoingTransformations(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

const adomaTransformation: TransformationApiRead = {
  ...createTransformation({
    id: 7,
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 1,
        operateur: { id: 1, name: "ADOMA" },
        structureVersion: {
          departementAdministratif: "50",
          type: StructureType.CADA,
        },
      }),
      createStructureVersionTransformation({
        id: 2,
        structureVersion: { type: StructureType.HUDA },
      }),
    ],
  }),
  createdAt: "2026-05-02T10:00:00.000Z",
  updatedAt: "2026-05-04T10:00:00.000Z",
};

describe("OngoingTransformationsBanner", () => {
  it("renders nothing when there is no ongoing transformation", () => {
    mockUseOngoingTransformations.mockReturnValue({ transformations: [] });

    const { container } = render(<OngoingTransformationsBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("is collapsed by default: shows the count but hides the rows", () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [adomaTransformation],
    });

    render(<OngoingTransformationsBanner />);

    expect(screen.getByText(/Saisies de créations/)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("ADOMA")).not.toBeInTheDocument();
  });

  it("expands on click and renders the transformation details", async () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [adomaTransformation],
    });
    const user = userEvent.setup();

    render(<OngoingTransformationsBanner />);
    await user.click(screen.getByRole("button"));

    expect(screen.getByText("ADOMA")).toBeInTheDocument();
    expect(screen.getByText(/Manche/)).toBeInTheDocument();
    expect(screen.getByText(/\(50\)/)).toBeInTheDocument();
    expect(screen.getByText("2 structures")).toBeInTheDocument();
    expect(screen.getByText(/\(CADA, HUDA\)/)).toBeInTheDocument();
    expect(screen.getByText(/Initiée le/)).toBeInTheDocument();
    expect(screen.getByText(/Modifiée le/)).toBeInTheDocument();

    const editLink = screen.getByRole("link", {
      name: "Modifier la transformation",
    });
    expect(editLink).toHaveAttribute(
      "href",
      "/structures/transformation/7"
    );
  });

  it("uses the singular label when a transformation has a single structure", async () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [
        {
          ...createTransformation({
            id: 9,
            structureVersionTransformations: [
              createStructureVersionTransformation({
                id: 1,
                operateur: { id: 2, name: "COALLIA" },
                structureVersion: {
                  departementAdministratif: "50",
                  type: StructureType.CAES,
                },
              }),
            ],
          }),
          createdAt: "2026-05-02T10:00:00.000Z",
          updatedAt: "2026-05-04T10:00:00.000Z",
        },
      ],
    });
    const user = userEvent.setup();

    render(<OngoingTransformationsBanner />);
    await user.click(screen.getByRole("button"));

    expect(screen.getByText("1 structure")).toBeInTheDocument();
    expect(screen.getByText(/\(CAES\)/)).toBeInTheDocument();
  });

  it("resolves the departement from the linked structure when the version has none", async () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [
        createTransformation({
          id: 11,
          structureVersionTransformations: [
            createStructureVersionTransformation({
              id: 1,
              structureVersion: {
                structure: { codeBhasile: "ABC", departementAdministratif: "13" },
              },
            }),
          ],
        }),
      ],
    });
    const user = userEvent.setup();

    render(<OngoingTransformationsBanner />);
    await user.click(screen.getByRole("button"));

    expect(screen.getByText(/\(13\)/)).toBeInTheDocument();
  });
});
