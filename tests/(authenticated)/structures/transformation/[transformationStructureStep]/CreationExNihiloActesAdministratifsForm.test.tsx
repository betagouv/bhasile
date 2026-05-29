import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreationExNihiloActesAdministratifsForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/creation-ex-nihilo/CreationExNihiloActesAdministratifsForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockHandleValidation = vi.fn();

vi.mock("@/app/hooks/useTransformationFormHandling", () => ({
  useTransformationFormHandling: () => ({
    handleValidation: mockHandleValidation,
    prevStep: { route: "/prev-route" },
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ transformationStructureId: "7" }),
  useRouter: () => ({ push: vi.fn() }),
  notFound: vi.fn(),
}));

const filledActe = (
  id: number,
  category: ActeAdministratifCategory,
  key: string
): ActeAdministratifApiType => ({
  id,
  category,
  startDate: "2024-01-01T12:00:00.000Z",
  endDate: "2025-01-01T12:00:00.000Z",
  fileUploads: [{ id, key }],
});

const transformationWithActes = (
  actesAdministratifs: ActeAdministratifApiType[]
) =>
  createTransformation({
    id: 12,
    type: TransformationType.OUVERTURE_EX_NIHILO,
    structureTransformations: [
      createStructureTransformation({
        id: 7,
        type: StructureTransformationType.CREATION,
        actesAdministratifs,
      }),
    ],
  });

describe("CreationExNihiloActesAdministratifsForm (integration via FormWrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("submits the filled acts to handleValidation, dropping the empty Autres documents row", async () => {
    // GIVEN the three required acts are filled (file + dates), Autres documents left empty
    render(
      <CreationExNihiloActesAdministratifsForm
        structureTransformation={createStructureTransformation({
          id: 7,
          type: StructureTransformationType.CREATION,
        })}
        transformation={transformationWithActes([
          filledActe(1, "ARRETE_AUTORISATION", "k-autorisation"),
          filledActe(2, "CONVENTION", "k-convention"),
          filledActe(3, "ARRETE_TARIFICATION", "k-tarification"),
        ])}
      />
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the form validates and forwards the payload (empty AUTRE filtered out by the schema)
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    expect(payload.transformationId).toBe(12);
    expect(payload.structureTransformation.id).toBe(7);
    expect(payload.structureTransformation.type).toBe(
      StructureTransformationType.CREATION
    );
    const actes = payload.structureTransformation.actesAdministratifs;
    expect(actes).toHaveLength(3);
    expect(
      actes.map((acte: { category: string }) => acte.category).sort()
    ).toEqual(["ARRETE_AUTORISATION", "ARRETE_TARIFICATION", "CONVENTION"]);
  });

  it("does not submit when the required documents are missing", async () => {
    // GIVEN no acts provided -> the form seeds empty rows for each required category
    render(
      <CreationExNihiloActesAdministratifsForm
        structureTransformation={createStructureTransformation({
          id: 7,
          type: StructureTransformationType.CREATION,
        })}
        transformation={transformationWithActes([])}
      />
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );
    // let the async zod validation settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    // THEN validation blocks the submission
    expect(mockHandleValidation).not.toHaveBeenCalled();
  });
});
