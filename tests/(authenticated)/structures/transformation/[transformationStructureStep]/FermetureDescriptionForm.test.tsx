import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createStructureVersionTransformation,
  createTransformation,
} from "tests/test-utils/factories/transformation.factory";
import {
  getSavedStructureVersionTransformation,
  mockTransformationFetch,
  renderTransformationForm,
} from "tests/test-utils/transformationForm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FermetureDescriptionForm } from "@/app/(authenticated)/structures/transformation/[transformationId]/[transformationStructureType]/[transformationStructureId]/[transformationStructureStep]/_components/fermeture/FermetureDescriptionForm";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
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

describe("FermetureDescriptionForm (intégration jusqu'au fetch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = mockTransformationFetch(TRANSFORMATION_ID);
    localStorage.clear();
  });

  it("enregistre la date de fermeture dans structureVersion.effectiveDate et écarte la ligne de document vide", async () => {
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
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    const structureVersionTransformation = savedStructureVersionTransformation();
    expect(structureVersionTransformation.id).toBe(7);
    expect(structureVersionTransformation.type).toBe(
      StructureVersionTransformationType.FERMETURE
    );
    expect(structureVersionTransformation.structureVersion).toEqual({
      id: 12,
      structureId: 104,
      effectiveDate: "2024-09-30T12:00:00.000Z",
    });
    expect(structureVersionTransformation.actesAdministratifs).toEqual([]);
  });

  it("navigue quand même vers l'étape suivante quand la date de fermeture est absente", async () => {
    // GIVEN a fermeture without a closure date
    renderForm(fermetureTransformation({ id: 12, structureId: 104 }));

    // WHEN submitting without filling the date
    await userEvent.click(
      screen.getByRole("button", { name: "Étape suivante" })
    );

    // THEN the incomplete step is saved (PUT) and the user moves on (no blocking)
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/transformations/${TRANSFORMATION_ID}`,
        expect.objectContaining({ method: "PUT" })
      )
    );
    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/structures/transformation/12/verification"
      )
    );
  });

  it("transmet un document existant de la catégorie AUTRE", async () => {
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
