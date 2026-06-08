import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransformationVerificationPage from "@/app/(authenticated)/structures/transformation/[transformationId]/verification/page";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureVersionTransformationType } from "@/types/transformation.type";

const mockRouterPush = vi.fn();
const mockUseTransformationContext = vi.fn();
const mockUpdateTransformation = vi.fn();
const mockGetFetchState = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
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
  structureVersionTransformations,
}: {
  form?: ReturnType<typeof buildForm>;
  structureVersionTransformations: StructureVersionTransformationApiRead[];
}): TransformationApiRead =>
  ({
    id: 42,
    form,
    structureVersionTransformations,
  }) as TransformationApiRead;

describe("TransformationVerificationPage", () => {
  const mockSetTransformation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFetchState.mockReturnValue(0); // FetchState.IDLE
  });

  it("should disable the certify button when transformation.form is undefined", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: undefined,
        structureVersionTransformations: [buildStructureVersionTransformation(true)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByRole("button", { name: /je confirme/i })
    ).toBeDisabled();
  });

  it("should disable the certify button when at least one child form is not validated", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true, 1),
          buildStructureVersionTransformation(false, 2),
        ],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByRole("button", { name: /je confirme/i })
    ).toBeDisabled();
  });

  it("should disable the certify button when a structureVersionTransformation has no forms at all", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [buildStructureVersionTransformation(undefined)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByRole("button", { name: /je confirme/i })
    ).toBeDisabled();
  });

  it("should disable the certify button while save is in flight", () => {
    // GIVEN — fetchState LOADING (FetchState.LOADING = 1)
    mockGetFetchState.mockReturnValue(1);
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [buildStructureVersionTransformation(true)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByRole("button", { name: /je confirme/i })
    ).toBeDisabled();
  });

  it("should enable the certify button when all child forms are validated and no save is in flight", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [
          buildStructureVersionTransformation(true, 1),
          buildStructureVersionTransformation(true, 2),
        ],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(
      screen.getByRole("button", { name: /je confirme/i })
    ).toBeEnabled();
  });

  it("should PUT the transformation with form.status set to true and redirect to /structures on submit", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockUpdateTransformation.mockResolvedValue(42);
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [buildStructureVersionTransformation(true)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);
    await user.click(screen.getByRole("button", { name: /je confirme/i }));

    // THEN
    expect(mockUpdateTransformation).toHaveBeenCalledWith(
      42,
      {
        id: 42,
        form: { ...buildForm(false), status: true },
      },
      mockSetTransformation
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/structures");
  });

  it("should not redirect when updateTransformation rejects", async () => {
    // GIVEN
    const user = userEvent.setup();
    mockUpdateTransformation.mockRejectedValue(new Error("boom"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [buildStructureVersionTransformation(true)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);
    await user.click(screen.getByRole("button", { name: /je confirme/i }));

    // THEN
    expect(mockRouterPush).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should render SubmitError when fetchState is ERROR", () => {
    // GIVEN — FetchState.ERROR = 2
    mockGetFetchState.mockReturnValue(2);
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
        form: buildForm(false),
        structureVersionTransformations: [buildStructureVersionTransformation(true)],
      }),
      setTransformation: mockSetTransformation,
    });

    // WHEN
    render(<TransformationVerificationPage />);

    // THEN
    expect(screen.getByTestId("submit-error")).toBeInTheDocument();
  });

  it("should render one group per StructureVersionTransformationType, sorted FERMETURE → CONTRACTION → EXTENSION → CREATION", () => {
    // GIVEN
    mockUseTransformationContext.mockReturnValue({
      transformation: buildTransformation({
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
      }),
      setTransformation: mockSetTransformation,
    });

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
