import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FermetureDescriptionForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/fermeture/FermetureDescriptionForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
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
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  notFound: vi.fn(),
}));

const fermetureTransformation = (
  structureVersion: TransformationApiRead["structureTransformations"][number]["structureVersion"],
  actesAdministratifs: ActeAdministratifApiType[] = []
) =>
  createTransformation({
    id: 12,
    type: TransformationType.FERMETURE_SANS_TRANSFERT,
    structureTransformations: [
      createStructureTransformation({
        id: 7,
        type: StructureTransformationType.FERMETURE,
        structureVersion,
        actesAdministratifs,
      }),
    ],
  });

const renderForm = (transformation: TransformationApiRead) => {
  const [structureTransformation] = transformation.structureTransformations;
  return render(
    <FermetureDescriptionForm
      transformation={transformation}
      structureTransformation={structureTransformation}
    />
  );
};

const fillClosureDate = (container: HTMLElement, htmlDate: string) => {
  const dateInput = container.querySelector(
    'input[type="date"]'
  ) as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: htmlDate } });
};

describe("FermetureDescriptionForm (integration via FormWrapper)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("submits the closure date to structureVersion.effectiveDate and drops the empty document row", async () => {
    // GIVEN a fermeture with an existing structureVersion and no document filled
    const { container } = renderForm(
      fermetureTransformation({
        id: 12,
        structureId: 104,
        structure: { codeBhasile: "BHA-NOR-023" },
      })
    );

    // WHEN the agent picks a closure date and submits
    fillClosureDate(container, "2024-09-30");
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the date is forwarded as effectiveDate and the empty AUTRE row is filtered out
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    expect(payload.transformationId).toBe(12);
    expect(payload.structureTransformation.id).toBe(7);
    expect(payload.structureTransformation.type).toBe(
      StructureTransformationType.FERMETURE
    );
    expect(payload.structureTransformation.structureVersion).toEqual({
      id: 12,
      structureId: 104,
      effectiveDate: "2024-09-30T12:00:00.000Z",
    });
    expect(payload.structureTransformation.actesAdministratifs).toEqual([]);
  });

  it("does not submit when the closure date is missing", async () => {
    // GIVEN a fermeture without a closure date
    renderForm(fermetureTransformation({ id: 12, structureId: 104 }));

    // WHEN submitting without filling the date
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );
    // let the async zod validation settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    // THEN validation blocks the submission (the date is required)
    expect(mockHandleValidation).not.toHaveBeenCalled();
  });

  it("forwards an existing document of the AUTRE category", async () => {
    // GIVEN a fermeture with a document already uploaded
    const { container } = renderForm(
      fermetureTransformation({ id: 12, structureId: 104 }, [
        {
          id: 5,
          category: "AUTRE",
          name: "Arrêté préfectoral",
          fileUploads: [{ id: 5, key: "k-autre" }],
        },
      ])
    );

    // WHEN the agent picks a closure date and submits
    fillClosureDate(container, "2024-09-30");
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the document is forwarded alongside the closure date
    await waitFor(() => expect(mockHandleValidation).toHaveBeenCalledTimes(1));
    const payload = mockHandleValidation.mock.calls[0][0];
    const actes = payload.structureTransformation.actesAdministratifs;
    expect(actes).toHaveLength(1);
    expect(actes[0].category).toBe("AUTRE");
    expect(actes[0].fileUploads).toMatchObject([{ key: "k-autre" }]);
  });
});
