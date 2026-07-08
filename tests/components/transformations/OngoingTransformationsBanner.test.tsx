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
        structureType: StructureType.CADA,
        structureVersion: {
          departementAdministratif: "50",
        },
      }),
      createStructureVersionTransformation({
        id: 2,
        structureType: StructureType.HUDA,
      }),
    ],
  }),
  createdAt: "2026-05-02T10:00:00.000Z",
  updatedAt: "2026-05-04T10:00:00.000Z",
};

describe("OngoingTransformationsBanner", () => {
  it("n'affiche rien quand il n'y a aucune transformation en cours", () => {
    mockUseOngoingTransformations.mockReturnValue({ transformations: [] });

    const { container } = render(<OngoingTransformationsBanner />);

    expect(container).toBeEmptyDOMElement();
  });

  it("est replié par défaut : affiche le compteur mais masque les lignes", () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [adomaTransformation],
    });

    render(<OngoingTransformationsBanner />);

    expect(screen.getByText(/Saisies de créations/)).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("ADOMA")).not.toBeInTheDocument();
  });

  it("se déplie au clic et affiche les détails de la transformation", async () => {
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

  it("utilise le libellé au singulier quand une transformation ne porte qu'une seule structure", async () => {
    mockUseOngoingTransformations.mockReturnValue({
      transformations: [
        {
          ...createTransformation({
            id: 9,
            structureVersionTransformations: [
              createStructureVersionTransformation({
                id: 1,
                operateur: { id: 2, name: "COALLIA" },
                structureType: StructureType.CAES,
                structureVersion: {
                  departementAdministratif: "50",
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

  it("récupère le département depuis la structure liée quand la version n'en a pas", async () => {
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
