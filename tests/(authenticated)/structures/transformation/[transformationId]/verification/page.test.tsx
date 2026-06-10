import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransformationVerificationPage from "@/app/(authenticated)/structures/transformation/[transformationId]/verification/page";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const { mockModalOpen } = vi.hoisted(() => ({ mockModalOpen: vi.fn() }));
const mockRouterPush = vi.fn();
const mockUseTransformationContext = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockGetFetchState = vi.fn();
const setShouldShowIncompleteSteps = vi.fn();
const mockSetTransformation = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@codegouvfr/react-dsfr/Modal", () => ({
  createModal: () => ({
    open: mockModalOpen,
    close: vi.fn(),
    Component: ({ children }: { children: ReactNode }) => (
      <div data-testid="confirmation-modal">{children}</div>
    ),
  }),
}));

vi.mock("@codegouvfr/react-dsfr/Modal/useIsModalOpen", () => ({
  useIsModalOpen: () => false,
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext",
  () => ({
    useTransformationContext: () => mockUseTransformationContext(),
  })
);

vi.mock("@/app/hooks/useTransformations", () => ({
  useTransformations: () => ({
    updateTransformation: mockUpdateTransformation,
  }),
}));

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({
    getFetchState: (key: string) => mockGetFetchState(key),
    setFetchState: vi.fn(),
  }),
}));

vi.mock("@/app/hooks/useTransformationFormNavigation", () => ({
  useTransformationFormNavigation: () => ({
    prevStep: {
      name: "actes-administratifs",
      label: "Actes administratifs",
      route: "/some/previous/route",
    },
  }),
}));

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/verification/_components/StructureVersionTransformationGroup",
  () => ({
    StructureVersionTransformationGroup: ({
      type,
      structureVersionTransformations,
    }: {
      type: string;
      structureVersionTransformations: StructureVersionTransformationApiRead[];
    }) => (
      <div
        data-testid={`structure-transformation-group-${type}`}
        data-count={structureVersionTransformations.length}
      />
    ),
  })
);

vi.mock("@/app/components/SubmitError", () => ({
  SubmitError: () => <div data-testid="submit-error" />,
}));

const buildForm = (status: boolean) => ({
  id: 100,
  status,
  formDefinition: { id: 1, slug: "v", name: "Vérification", version: 1 },
  formSteps: [],
});

const buildStructureVersionTransformation = (
  childFormStatus: boolean | undefined,
  id = 1,
  type: StructureVersionTransformationType = StructureVersionTransformationType.EXTENSION
): StructureVersionTransformationApiRead => ({
  id,
  type,
  form: childFormStatus === undefined ? undefined : buildForm(childFormStatus),
});

const buildTransformation = ({
  form,
  type,
  structureVersionTransformations,
}: {
  form?: ReturnType<typeof buildForm>;
  type?: TransformationType;
  structureVersionTransformations: StructureVersionTransformationApiRead[];
}): TransformationApiRead =>
  ({
    id: 42,
    type,
    form,
    structureVersionTransformations,
  }) as TransformationApiRead;

const mockContext = (
  transformation: TransformationApiRead,
  shouldShowIncompleteSteps = false
) => {
  mockUseTransformationContext.mockReturnValue({
    transformation,
    setTransformation: mockSetTransformation,
    shouldShowIncompleteSteps,
    setShouldShowIncompleteSteps,
  });
};

const certifyButton = () =>
  screen.getByRole("button", { name: /je confirme/i });

describe("TransformationVerificationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFetchState.mockReturnValue(FetchState.IDLE);
  });

  it("keeps the certify button clickable even when a child form is not validated", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true, 1),
          buildStructureVersionTransformation(false, 2),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(certifyButton()).toBeEnabled();
  });

  it("disables the certify button only while a save is in flight", () => {
    // GIVEN
    mockGetFetchState.mockReturnValue(FetchState.LOADING);
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(certifyButton()).toBeDisabled();
  });

  it("flags incomplete steps and does not finalize when a child form is not validated", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true, 1),
          buildStructureVersionTransformation(false, 2),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);
    await user.click(certifyButton());

    // THEN
    expect(setShouldShowIncompleteSteps).toHaveBeenCalledWith(true);
    expect(mockUpdateTransformation).not.toHaveBeenCalled();
    expect(mockModalOpen).not.toHaveBeenCalled();
  });

  it("finalizes the transformation and opens the modal when every child form is validated", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockUpdateTransformation.mockResolvedValue(42);
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);
    await user.click(certifyButton());

    // THEN
    expect(mockUpdateTransformation).toHaveBeenCalledWith(
      42,
      {
        id: 42,
        form: { ...buildForm(false), status: true },
      },
      mockSetTransformation
    );
    await waitFor(() => expect(mockModalOpen).toHaveBeenCalled());
    expect(setShouldShowIncompleteSteps).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("does not open the modal when updateTransformation rejects", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockUpdateTransformation.mockRejectedValue(new Error("boom"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);
    await user.click(certifyButton());

    // THEN
    expect(mockModalOpen).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("shows the incomplete message when the flag is set and steps remain", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(false),
        ],
      }),
      true
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByText(/Certaines étapes ne sont pas encore complétées/)
    ).toBeInTheDocument();
  });

  it("hides the incomplete message when every step is validated even if the flag is set", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      }),
      true
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.queryByText(/Certaines étapes ne sont pas encore complétées/)
    ).toBeNull();
  });

  it("adds the remise-en-concurrence invitation to the modal body for a HUDA remise transformation", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        type: TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(screen.getByText(/Créer une structure/)).toBeInTheDocument();
  });

  it("omits the remise-en-concurrence invitation for a standard transformation", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        type: TransformationType.OUVERTURE_EX_NIHILO,
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(screen.queryByText(/Créer une structure/)).toBeNull();
  });

  it("renders SubmitError when fetchState is ERROR", () => {
    // GIVEN
    mockGetFetchState.mockReturnValue(FetchState.ERROR);
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(screen.getByTestId("submit-error")).toBeInTheDocument();
  });

  it("renders one group per StructureVersionTransformationType, sorted FERMETURE → CREATION", () => {
    // GIVEN
    mockContext(
      buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(
            true,
            1,
            StructureVersionTransformationType.CREATION
          ),
          buildStructureVersionTransformation(
            true,
            2,
            StructureVersionTransformationType.FERMETURE
          ),
          buildStructureVersionTransformation(
            true,
            3,
            StructureVersionTransformationType.FERMETURE
          ),
        ],
      })
    );

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByTestId("structure-transformation-group-FERMETURE")
    ).toHaveAttribute("data-count", "2");
    expect(
      screen.getByTestId("structure-transformation-group-CREATION")
    ).toHaveAttribute("data-count", "1");
    const groups = screen.getAllByTestId(/structure-transformation-group-/);
    expect(groups.map((group) => group.dataset.testid)).toEqual([
      "structure-transformation-group-FERMETURE",
      "structure-transformation-group-CREATION",
    ]);
  });
});
