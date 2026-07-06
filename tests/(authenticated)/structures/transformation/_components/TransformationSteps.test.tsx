import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransformationSteps } from "@/app/(authenticated)/structures/transformation/_components/TransformationSteps";
import { FetchState } from "@/types/fetch-state.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import {
  createTransformation,
  createTransformationForm,
} from "../../../../test-utils/factories/transformation.factory";

const mockUsePathname = vi.fn<() => string>();
const mockUseOptionalTransformationContext = vi.fn<
  () => { shouldShowIncompleteSteps: boolean }
>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

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

describe("TransformationSteps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    mockUseOptionalTransformationContext.mockReturnValue({
      shouldShowIncompleteSteps: false,
    });
  });

  it("n'affiche rien quand il n'y a pas de transformation", () => {
    // WHEN
    const { container } = render(<TransformationSteps transformation={null} />);

    // THEN
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche chaque structureVersionTransformation comme un groupe d'étapes", () => {
    // GIVEN
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 1,
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { structureId: 1001, structure: { codeBhasile: "1001" } },
      },
      {
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
      {
        id: 3,
        type: StructureVersionTransformationType.CREATION,
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

  it("trie les étapes dans l'ordre Fermeture, Contraction, Extension, Création", () => {
    // GIVEN
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 1,
        type: StructureVersionTransformationType.CREATION,
        structureVersion: { structureId: 1001, structure: { codeBhasile: "1001" } },
      },
      {
        id: 2,
        type: StructureVersionTransformationType.EXTENSION,
        structureVersion: { structureId: 1002, structure: { codeBhasile: "1002" } },
      },
      {
        id: 3,
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion: { structureId: 1003, structure: { codeBhasile: "1003" } },
      },
      {
        id: 4,
        type: StructureVersionTransformationType.CONTRACTION,
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

  it("affiche les trois sous-étapes pour une étape EXTENSION", () => {
    // GIVEN
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 7,
        type: StructureVersionTransformationType.EXTENSION,
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

  it("n'affiche que la sous-étape Description pour une étape FERMETURE", () => {
    // GIVEN
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 9,
        type: StructureVersionTransformationType.FERMETURE,
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

  it("marque la sous-étape correspondant au pathname courant comme page courante", () => {
    // GIVEN
    mockUsePathname.mockReturnValue(
      "/structures/transformation/42/extension/7/places-et-hebergement"
    );
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 7,
        type: StructureVersionTransformationType.EXTENSION,
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

  it("construit les hrefs de chaque sous-étape à partir des ids de la transformation et de l'étape", () => {
    // GIVEN
    const transformation = createTransformation({ structureVersionTransformations: [
      {
        id: 7,
        type: StructureVersionTransformationType.EXTENSION,
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
    [StructureVersionTransformationType.EXTENSION, "extension"],
    [StructureVersionTransformationType.CONTRACTION, "contraction"],
    [StructureVersionTransformationType.FERMETURE, "fermeture"],
    [StructureVersionTransformationType.CREATION, "creation"],
  ])(
    "utilise le segment correspondant à un type %s dans les hrefs",
    (type: StructureVersionTransformationType, segment: string) => {
      // GIVEN
      const transformation = createTransformation({ structureVersionTransformations: [
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

  it("affiche une pastille rouge sur chaque étape non validée quand shouldShowIncompleteSteps est true", () => {
    // GIVEN — flag set and an extension whose steps are all not validated (no form)
    mockUseOptionalTransformationContext.mockReturnValue({
      shouldShowIncompleteSteps: true,
    });
    const transformation = createTransformation({
      structureVersionTransformations: [
        {
          id: 7,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            structureId: 1002,
            structure: { codeBhasile: "1002" },
          },
        },
      ],
    });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

    // THEN — one pastille per substep
    expect(screen.getAllByText("Étape non complétée")).toHaveLength(3);
  });

  it("n'affiche aucune pastille quand shouldShowIncompleteSteps est false", () => {
    // GIVEN — flag unset (default)
    const transformation = createTransformation({
      structureVersionTransformations: [
        {
          id: 7,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            structureId: 1002,
            structure: { codeBhasile: "1002" },
          },
        },
      ],
    });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

    // THEN
    expect(screen.queryByText("Étape non complétée")).toBeNull();
  });

  it("n'affiche pas de pastille sur une étape validée même quand le flag est activé", () => {
    // GIVEN — flag set and a form where only the description step is VALIDE
    mockUseOptionalTransformationContext.mockReturnValue({
      shouldShowIncompleteSteps: true,
    });
    const transformation = createTransformation({
      structureVersionTransformations: [
        {
          id: 7,
          type: StructureVersionTransformationType.EXTENSION,
          structureVersion: {
            structureId: 1002,
            structure: { codeBhasile: "1002" },
          },
          form: createTransformationForm({
            validatedSlugs: ["01-identification"],
          }),
        },
      ],
    });

    // WHEN
    render(<TransformationSteps transformation={transformation} />);

    // THEN — pastilles only on the two non-validated substeps
    expect(screen.getAllByText("Étape non complétée")).toHaveLength(2);
    const descriptionLink = screen.getByRole("link", { name: "Description" });
    expect(
      within(descriptionLink).queryByText("Étape non complétée")
    ).toBeNull();
  });
});

