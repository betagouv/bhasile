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
  structureVersion: {
    nom: "ACTION NORMANDIE",
    type: StructureType.CADA,
    departementAdministratif: "Manche",
    effectiveDate: "2026-08-25T12:00:00.000Z",
    structure: {
      codeBhasile: "BHA-NOR-025",
      operateur: { id: 10, name: "Groupe SOS" },
    },
    structureTypologies: [
      {
        year: 2026,
        placesAutorisees: 47,
      },
    ],
  },
  ...overrides,
});

describe("StructureVersionTransformationItem", () => {
  it("should render the StructureCard with values derived from structureVersion + structure", () => {
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

  it.each([
    ["nom", { nom: undefined }],
    ["type", { type: undefined }],
    ["departementAdministratif", { departementAdministratif: undefined }],
  ])(
    "should hide the StructureCard when structureVersion.%s is missing",
    (_label, structureVersionOverride) => {
      // GIVEN
      const structureVersionTransformation = buildCompleteStructureVersionTransformation({
        structureVersion: {
          ...buildCompleteStructureVersionTransformation().structureVersion,
          ...structureVersionOverride,
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
    }
  );

  it("should render the StructureCard without codeBhasile when the structure is not created yet", () => {
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

  it("should hide the StructureCard when no operateur is resolvable", () => {
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

  it("should fall back to structureVersionTransformation.operateur when structureVersion.structure.operateur is missing", () => {
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
    "should render the verb '%s' for type %s",
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

  it("should hide the effectiveDate line and placesAutorisees line when effectiveDate is missing", () => {
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

  it("affiche la ligne des places fermées pour une FERMETURE à partir de la typologie au niveau structure", () => {
    // GIVEN — a closure: places come from the predecessor (structure-level)
    // typology resolved at the effective year, not the version-level one
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      type: StructureVersionTransformationType.FERMETURE,
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: {
          codeBhasile: "BHA-NOR-025",
          operateur: { id: 10, name: "Groupe SOS" },
          structureTypologies: [{ year: 2026, placesAutorisees: 47 }],
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

  it("masque la ligne des places fermées pour une FERMETURE quand la typologie structure la plus récente est déjà à zéro", () => {
    // GIVEN — no typology for the closure year (2026); the most-recent
    // millesime fallback lands on a post-closure year zeroed at 0 places
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      type: StructureVersionTransformationType.FERMETURE,
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structure: {
          codeBhasile: "BHA-NOR-025",
          operateur: { id: 10, name: "Groupe SOS" },
          structureTypologies: [{ year: 2027, placesAutorisees: 0 }],
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
    StructureVersionTransformationType.CREATION,
    StructureVersionTransformationType.EXTENSION,
    StructureVersionTransformationType.CONTRACTION,
  ])(
    "should render the placesAutorisees line for type %s",
    (structureVersionTransformationType) => {
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
        screen.getByText("47 places autorisées au total")
      ).toBeInTheDocument();
    }
  );

  it("should hide the placesAutorisees line when no typology matches the effectiveDate year", () => {
    // GIVEN — effectiveDate is 2026 but typology is for 2025
    const structureVersionTransformation = buildCompleteStructureVersionTransformation({
      structureVersion: {
        ...buildCompleteStructureVersionTransformation().structureVersion,
        structureTypologies: [{ year: 2025, placesAutorisees: 47 }],
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
