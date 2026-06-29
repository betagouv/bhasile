import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransformationSelectionsPage from "@/app/(authenticated)/structures/transformation/[transformationId]/selection/page";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { FetchState } from "@/types/fetch-state.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const mockRouterPush = vi.fn();
const mockUseTransformationContext = vi.fn();
const mockSetTransformation = vi.fn();
const mockResetTransformationSelection = vi.fn();
const mockModalOpen = vi.fn();
const mockModalClose = vi.fn();

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
    resetTransformationSelection: mockResetTransformationSelection,
  }),
}));

vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({
    getFetchState: () => FetchState.IDLE,
    setFetchState: vi.fn(),
  }),
}));

vi.mock(
  "@/app/components/forms/transformation-types/TransformationTypeForms",
  () => ({
    TransformationTypeForms: ({
      onSubmit,
    }: {
      onSubmit: (type: TransformationType, svts: unknown[]) => void;
    }) => (
      <button
        data-testid="valider-selection"
        onClick={() =>
          onSubmit(TransformationType.FERMETURE_SANS_TRANSFERT, [
            {
              type: StructureVersionTransformationType.FERMETURE,
              structureVersion: { structureId: 7 },
            },
          ])
        }
      >
        valider
      </button>
    ),
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/selection/_components/TransformationSelectionSummary",
  () => ({
    TransformationSelectionSummary: () => (
      <div data-testid="selection-summary" />
    ),
  })
);

vi.mock(
  "@/app/(authenticated)/structures/transformation/[transformationId]/selection/_components/ReinitialiserSelectionModal",
  () => ({
    reinitialiserSelectionModal: {
      open: () => mockModalOpen(),
      close: () => mockModalClose(),
    },
    ReinitialiserSelectionModal: ({
      onConfirm,
    }: {
      onConfirm: () => void;
    }) => (
      <button data-testid="confirm-reset" onClick={onConfirm}>
        confirmer
      </button>
    ),
  })
);

const oldTransformation = {
  id: 42,
  type: TransformationType.OUVERTURE_EX_NIHILO,
  structureVersionTransformations: [
    { id: 1, type: StructureVersionTransformationType.CREATION },
  ],
} as TransformationApiRead;

const freshTransformation = {
  id: 42,
  type: TransformationType.FERMETURE_SANS_TRANSFERT,
  structureVersionTransformations: [
    { id: 999, type: StructureVersionTransformationType.FERMETURE },
  ],
} as TransformationApiRead;

describe("TransformationSelectionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTransformationContext.mockReturnValue({
      transformation: oldTransformation,
      setTransformation: mockSetTransformation,
    });
    mockResetTransformationSelection.mockResolvedValue(freshTransformation);
  });

  it("affiche le récap et le bouton Modifier en mode vue", () => {
    render(<TransformationSelectionsPage />);

    expect(screen.getByTestId("selection-summary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /modifier le cas de figure/i })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("valider-selection")).toBeNull();
  });

  it("navigue vers la 1ère étape construite depuis la transformation FRAÎCHE après reset", async () => {
    // GIVEN
    const user = userEvent.setup();
    render(<TransformationSelectionsPage />);
    await user.click(
      screen.getByRole("button", { name: /modifier le cas de figure/i })
    );

    // WHEN
    await user.click(screen.getByTestId("valider-selection"));
    await user.click(screen.getByTestId("confirm-reset"));

    // THEN
    expect(mockResetTransformationSelection).toHaveBeenCalledWith(
      42,
      {
        type: TransformationType.FERMETURE_SANS_TRANSFERT,
        structureVersionTransformations: [
          {
            type: StructureVersionTransformationType.FERMETURE,
            structureVersion: { structureId: 7 },
          },
        ],
      },
      mockSetTransformation
    );
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledTimes(1));
    // Route construite avec le NOUVEL id de SVT (999), pas l'ancien (1).
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.stringContaining("/fermeture/999/")
    );
  });
});
