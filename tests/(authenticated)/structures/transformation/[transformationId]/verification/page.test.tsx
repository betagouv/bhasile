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

vi.mock("@/app/components/forms/TransformationFakeSaver", () => ({
  TransformationFakeSaver: () => null,
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

  it("garde le bouton de certification cliquable même quand un formulaire enfant n'est pas validé", () => {
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

  it("désactive le bouton de certification uniquement pendant une sauvegarde en cours", () => {
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

  it("signale les étapes incomplètes et ne finalise pas quand un formulaire enfant n'est pas validé", async () => {
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

  it("finalise la transformation et ouvre la modale quand tous les formulaires enfants sont validés", async () => {
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

  it("n'ouvre pas la modale quand updateTransformation échoue", async () => {
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

  it("affiche le message d'incomplétude quand le flag est activé et qu'il reste des étapes", () => {
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

  it("masque le message d'incomplétude quand toutes les étapes sont validées même si le flag est activé", () => {
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

  it("ajoute l'invitation à la remise en concurrence dans le corps de la modale pour une transformation HUDA de remise", () => {
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

  it("omet l'invitation à la remise en concurrence pour une transformation standard", () => {
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

  it("affiche SubmitError quand fetchState vaut ERROR", () => {
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

  it("affiche un groupe par StructureVersionTransformationType, trié FERMETURE → CREATION", () => {
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
