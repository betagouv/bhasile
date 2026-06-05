import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StructureTransformationItem } from "@/app/(authenticated)/structures/transformation/[transformationId]/verification/_components/StructureTransformationItem";
import { StructureTransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import { StructureTransformationType } from "@/types/transformation.type";

type StructureCardStubProps = {
  nom: string;
  codeBhasile: string;
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

const buildCompleteStructureTransformation = (
  overrides: Partial<StructureTransformationApiRead> = {}
): StructureTransformationApiRead => ({
  id: 1,
  type: StructureTransformationType.EXTENSION,
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

describe("StructureTransformationItem", () => {
  it("should render the StructureCard with values derived from structureVersion + structure", () => {
    // GIVEN
    const structureTransformation = buildCompleteStructureTransformation();

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
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
      const structureTransformation = buildCompleteStructureTransformation({
        structureVersion: {
          ...buildCompleteStructureTransformation().structureVersion,
          ...structureVersionOverride,
        },
      });

      // WHEN
      render(
        <StructureTransformationItem
          structureTransformation={structureTransformation}
        />
      );

      // THEN
      expect(screen.queryByTestId("structure-card")).not.toBeInTheDocument();
    }
  );

  it("should hide the StructureCard when codeBhasile is missing", () => {
    // GIVEN
    const structureTransformation = buildCompleteStructureTransformation({
      structureVersion: {
        ...buildCompleteStructureTransformation().structureVersion,
        structure: {
          // @ts-expect-error — testing the runtime guard against a missing codeBhasile
          codeBhasile: undefined,
          operateur: { id: 1, name: "X" },
        },
      },
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.queryByTestId("structure-card")).not.toBeInTheDocument();
  });

  it("should hide the StructureCard when no operateur is resolvable", () => {
    // GIVEN — structureVersion.structure.operateur missing AND structureTransformation.operateur missing
    const structureTransformation = buildCompleteStructureTransformation({
      operateur: undefined,
      structureVersion: {
        ...buildCompleteStructureTransformation().structureVersion,
        structure: { codeBhasile: "BHA-NOR-025", operateur: undefined },
      },
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.queryByTestId("structure-card")).not.toBeInTheDocument();
  });

  it("should fall back to structureTransformation.operateur when structureVersion.structure.operateur is missing", () => {
    // GIVEN
    const structureTransformation = buildCompleteStructureTransformation({
      operateur: { id: 99, name: "Opérateur fallback" },
      structureVersion: {
        ...buildCompleteStructureTransformation().structureVersion,
        structure: { codeBhasile: "BHA-NOR-025", operateur: undefined },
      },
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.getByTestId("structure-card")).toHaveAttribute(
      "data-operateur",
      "Opérateur fallback"
    );
  });

  it.each([
    [StructureTransformationType.CREATION, "ouverture"],
    [StructureTransformationType.EXTENSION, "extension"],
    [StructureTransformationType.CONTRACTION, "contraction"],
    [StructureTransformationType.FERMETURE, "fermeture"],
  ])(
    "should render the verb '%s' for type %s",
    (structureTransformationType, expectedVerb) => {
      // GIVEN
      const structureTransformation = buildCompleteStructureTransformation({
        type: structureTransformationType,
      });

      // WHEN
      render(
        <StructureTransformationItem
          structureTransformation={structureTransformation}
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
    const structureTransformation = buildCompleteStructureTransformation({
      structureVersion: {
        ...buildCompleteStructureTransformation().structureVersion,
        effectiveDate: undefined,
      },
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.queryByText("25/08/2026")).not.toBeInTheDocument();
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });

  it("should hide the placesAutorisees line for FERMETURE even when the typology exists", () => {
    // GIVEN
    const structureTransformation = buildCompleteStructureTransformation({
      type: StructureTransformationType.FERMETURE,
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });

  it.each([
    StructureTransformationType.CREATION,
    StructureTransformationType.EXTENSION,
    StructureTransformationType.CONTRACTION,
  ])(
    "should render the placesAutorisees line for type %s",
    (structureTransformationType) => {
      // GIVEN
      const structureTransformation = buildCompleteStructureTransformation({
        type: structureTransformationType,
      });

      // WHEN
      render(
        <StructureTransformationItem
          structureTransformation={structureTransformation}
        />
      );

      // THEN
      const placesElement = screen.getByText("47 places autorisées");
      expect(placesElement.parentElement?.textContent).toBe(
        "47 places autorisées au total"
      );
    }
  );

  it("should hide the placesAutorisees line when no typology matches the effectiveDate year", () => {
    // GIVEN — effectiveDate is 2026 but typology is for 2025
    const structureTransformation = buildCompleteStructureTransformation({
      structureVersion: {
        ...buildCompleteStructureTransformation().structureVersion,
        structureTypologies: [{ year: 2025, placesAutorisees: 47 }],
      },
    });

    // WHEN
    render(
      <StructureTransformationItem
        structureTransformation={structureTransformation}
      />
    );

    // THEN
    expect(screen.queryByText(/places autorisées/)).not.toBeInTheDocument();
  });
});
