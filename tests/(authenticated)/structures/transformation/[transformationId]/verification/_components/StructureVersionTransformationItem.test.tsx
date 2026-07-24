import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StructureVersionTransformationItem } from "@/app/(authenticated)/structures/transformation/[transformationId]/verification/_components/StructureVersionTransformationItem";
import { StructureVersionTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

type StructureCardStubProps = {
  nom: string;
  codeBhasile?: string;
  type: StructureType;
  operateur: { name: string };
  departementAdministratif: string;
};

vi.mock("@/app/components/StructureCard", () => ({
  StructureCard: ({
    nom,
    codeBhasile,
    type,
    operateur,
    departementAdministratif,
  }: StructureCardStubProps) => (
    <div
      data-testid="structure-card"
      data-nom={nom}
      data-code={codeBhasile}
      data-type={type}
      data-operateur={operateur.name}
      data-dept={departementAdministratif}
    />
  ),
}));

const buildCompleteStructureVersionTransformation = (
  overrides: Partial<StructureVersionTransformationApiRead> = {}
): StructureVersionTransformationApiRead => ({
  id: 1,
  type: StructureVersionTransformationType.EXTENSION,
  structureType: StructureType.CADA,
  structureVersion: {
    nom: "ACTION NORMANDIE",
    departementAdministratif: "Manche",
    effectiveDate: "2026-08-25T12:00:00.000Z",
    structure: {
      codeBhasile: "BHA-NOR-025",
      operateur: { id: 10, name: "Groupe SOS" },
    },
    placesAutorisees: 47,
  },
  ...overrides,
});

describe("StructureVersionTransformationItem", () => {
  it("affiche la StructureCard avec les valeurs dérivées de structureVersion + structure", () => {
    // GIVEN
    const structureVersionTransformation = buildCompleteStructureVersionTransformation();

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    const card = screen.getByTestId("structure-card");
    expect(card).toHaveAttribute("data-nom", "ACTION NORMANDIE");
    expect(card).toHaveAttribute("data-code", "BHA-NOR-025");
    expect(card).toHaveAttribute("data-type", "CADA");
    expect(card).toHaveAttribute("data-operateur", "Groupe SOS");
    expect(card).toHaveAttribute("data-dept", "Manche");
  });

  it.each<
    [string, () => StructureVersionTransformationApiRead]
  >([
    [
      "nom",
      () =>
        buildCompleteStructureVersionTransformation({
          structureVersion: {
            ...buildCompleteStructureVersionTransformation().structureVersion,
            nom: undefined,
          },
        }),
    ],
    [
      "structureType",
      () =>
        buildCompleteStructureVersionTransformation({ structureType: undefined }),
    ],
    [
      "departementAdministratif",
      () =>
        buildCompleteStructureVersionTransformation({
          structureVersion: {
            ...buildCompleteStructureVersionTransformation().structureVersion,
            departementAdministratif: undefined,
          },
        }),
    ],
  ])("masque la StructureCard quand %s est absent", (_label, build) => {
    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={build()}
      />
    );

    // THEN
    expect(screen.queryByTestId("structure-card")).not.toBeInTheDocument();
  });

  it("affiche la StructureCard sans codeBhasile quand la structure n'est pas encore créée", () => {
    // GIVEN — a CREATION block: the structure (and its codeBhasile) does not exist
    // yet, and the operateur is carried by the structureVersionTransformation itself
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      type: StructureVersionTransformationType.CREATION,
      operateur: { id: 7, name: "Croix-Rouge" },
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: undefined,
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    const card = screen.getByTestId("structure-card");
    expect(card).toHaveAttribute("data-nom", "ACTION NORMANDIE");
    expect(card).not.toHaveAttribute("data-code");
    expect(card).toHaveAttribute("data-type", "CADA");
    expect(card).toHaveAttribute("data-operateur", "Croix-Rouge");
    expect(card).toHaveAttribute("data-dept", "Manche");
  });

  it("masque la StructureCard quand aucun opérateur n'est résolvable", () => {
    // GIVEN — structureVersion.structure.operateur missing AND structureVersionTransformation.operateur missing
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      operateur: undefined,
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: { codeBhasile: "BHA-NOR-025", operateur: undefined },
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(screen.queryByTestId("structure-card")).not.toBeInTheDocument();
  });

  it("se rabat sur structureVersionTransformation.operateur quand structureVersion.structure.operateur est absent", () => {
    // GIVEN
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      operateur: { id: 99, name: "Opérateur fallback" },
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: { codeBhasile: "BHA-NOR-025", operateur: undefined },
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(screen.getByTestId("structure-card")).toHaveAttribute(
      "data-operateur",
      "Opérateur fallback"
    );
  });

  it.each([
    [StructureVersionTransformationType.CREATION, "ouverture"],
    [StructureVersionTransformationType.EXTENSION, "extension"],
    [StructureVersionTransformationType.CONTRACTION, "contraction"],
    [StructureVersionTransformationType.FERMETURE, "fermeture"],
  ])(
    "affiche le verbe '%s' pour le type %s",
    (structureVersionTransformationType, expectedVerb) => {
      // GIVEN
      const structureVersionTransformation = buildCompleteStructureVersionTransformation({
        type: structureVersionTransformationType,
      });

      // WHEN
      render(
        <StructureVersionTransformationItem
          structureVersionTransformation={structureVersionTransformation}
        />
      );

      // THEN
      const dateElement = screen.getByText("25/08/2026");
      expect(dateElement.parentElement?.textContent).toBe(
        `${expectedVerb} le 25/08/2026`
      );
    }
  );

  it("masque la ligne effectiveDate et la ligne placesAutorisees quand effectiveDate est absent", () => {
    // GIVEN
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        effectiveDate: undefined,
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(screen.queryByText("25/08/2026")).not.toBeInTheDocument();
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });

  it("affiche la ligne des places fermées pour une FERMETURE depuis le scalaire de la structure source", () => {
    // GIVEN — une fermeture : les places fermées viennent du scalaire de la
    // structure source (résolu par le serveur), pas d'une typologie par année.
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      type: StructureVersionTransformationType.FERMETURE,
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: {
          codeBhasile: "BHA-NOR-025",
          operateur: { id: 10, name: "Groupe SOS" },
          placesAutorisees: 47,
        },
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(
      screen.getByText("47 place(s) fermée(s)")
    ).toBeInTheDocument();
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });

  it("masque la ligne des places fermées pour une FERMETURE quand la structure source est déjà à zéro place", () => {
    // GIVEN — la structure source ne porte aucune place (scalaire à 0).
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      type: StructureVersionTransformationType.FERMETURE,
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: {
          codeBhasile: "BHA-NOR-025",
          operateur: { id: 10, name: "Groupe SOS" },
          placesAutorisees: 0,
        },
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(screen.queryByText(/place\(s\) fermée\(s\)/)).not.toBeInTheDocument();
  });

  it.each([
    [StructureVersionTransformationType.CREATION, "ouverture"],
    [StructureVersionTransformationType.EXTENSION, "extension"],
    [StructureVersionTransformationType.CONTRACTION, "contraction"],
  ])(
    "affiche la ligne placesAutorisees pour le type %s",
    (structureVersionTransformationType, expectedSuffix) => {
      // GIVEN
      const structureVersionTransformation = buildCompleteStructureVersionTransformation({
        type: structureVersionTransformationType,
      });

      // WHEN
      render(
        <StructureVersionTransformationItem
          structureVersionTransformation={structureVersionTransformation}
        />
      );

      // THEN
      expect(
        screen.getByText(`47 places autorisées au total après ${expectedSuffix}`)
      ).toBeInTheDocument();
    }
  );

  it("masque la ligne placesAutorisees quand la version n'en porte pas (fermeture)", () => {
    // GIVEN — une FERMETURE ne porte aucune place sur sa version.
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        placesAutorisees: undefined,
      },
    });

    // WHEN
    render(
      <StructureVersionTransformationItem
        structureVersionTransformation={structureVersionTransformation}
      />
    );

    // THEN
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });
});
