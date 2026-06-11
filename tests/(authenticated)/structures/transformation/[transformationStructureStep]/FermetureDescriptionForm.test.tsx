import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
  createTransformationForm,
} from "tests/test-utils/factories/transformation.factory";
import {
  getSavedFormStepStatus,
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FermetureDescriptionForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/fermeture/FermetureDescriptionForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const TRANSFORMATION_ID = 12;
const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({
    transformationStructureType: StructureVersionTransformationType.FERMETURE,
    transformationStructureId: "7",
    transformationStructureStep: StructureVersionTransformationStep.DESCRIPTION,
  }),
  usePathname: () => "/structures/transformation/12/fermeture/7/description",
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
  notFound: vi.fn(),
}));

let fetchMock: ReturnType<typeof mockTransformationFetch>;

const fermetureTransformation = (
  structureVersion: TransformationApiRead["structureVersionTransformations"][number]["structureVersion"],
  actesAdministratifs: ActeAdministratifApiType[] = []
) =>
  createTransformation({
    id: TRANSFORMATION_ID,
    type: TransformationType.FERMETURE_SANS_TRANSFERT,
    structureVersionTransformations: [
      createStructureVersionTransformation({
        id: 7,
        type: StructureVersionTransformationType.FERMETURE,
        structureVersion,
        actesAdministratifs,
        form: createTransformationForm("structure-transformation-fermeture", [
          { slug: "01-identification", label: "Description" },
        ]),
      }),
    ],
  });

const renderForm = (transformation: TransformationApiRead) => {
  const [structureVersionTransformation] =
    transformation.structureVersionTransformations;
  return renderTransformationForm(
    transformation,
    <FermetureDescriptionForm
      transformation={transformation}
      structureVersionTransformation={structureVersionTransformation}
    />
  );
};

const fillClosureDate = (container: HTMLElement, htmlDate: string) => {
  const dateInput = container.querySelector(
    'input[type="date"]'
  ) as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: htmlDate } });
};

const savedStructureVersionTransformation = () =>
  getSavedStructureVersionTransformation(fetchMock, TRANSFORMATION_ID);

describe("FermetureDescriptionForm (integration up to fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
  });

  it("saves the closure date as structureVersion.effectiveDate, drops the empty document row and derives VALIDE", async () => {
    const { container } = renderForm(
      fermetureTransformation({
        id: 12,
        structureId: 104,
        structure: { codeBhasile: "BHA-NOR-023" },
      })
    );

    fillClosureDate(container, "2024-09-30");
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const structureVersionTransformation = savedStructureVersionTransformation();
    expect(structureVersionTransformation.structureVersion).toEqual({
      id: 12,
      structureId: 104,
      effectiveDate: "2024-09-30T12:00:00.000Z",
    });
    expect(structureVersionTransformation.actesAdministratifs).toEqual([]);
    expect(
      getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "01-identification")
    ).toBe(StepStatus.VALIDE);
    expect(structureVersionTransformation.form.status).toBe(true);
  });

  it("still navigates to the next step when the closure date is missing, step stays COMMENCE", async () => {
    renderForm(fermetureTransformation({ id: 12, structureId: 104 }));

    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(
      getSavedFormStepStatus(fetchMock, TRANSFORMATION_ID, "01-identification")
    ).toBe(StepStatus.COMMENCE);
    expect(savedStructureVersionTransformation().form.status).toBe(false);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/transformation/12/verification"
    );
  });

  it("does not navigate when the save request fails", async () => {
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID, { failSave: true });
    const { container } = renderForm(
      fermetureTransformation({ id: 12, structureId: 104 })
    );

    fillClosureDate(container, "2024-09-30");
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("forwards an existing document of the AUTRE category", async () => {
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

    fillClosureDate(container, "2024-09-30");
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const actes = savedStructureVersionTransformation().actesAdministratifs;
    expect(actes).toHaveLength(1);
    expect(actes[0].category).toBe("AUTRE");
    expect(actes[0].fileUploads).toMatchObject([{ key: "k-autre" }]);
  });
});
