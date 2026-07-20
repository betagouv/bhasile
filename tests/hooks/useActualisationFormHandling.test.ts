import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  ACTUALISATION_SAVE_KEY,
  useActualisationFormHandling,
} from "@/app/hooks/useActualisationFormHandling";
import { ApiError } from "@/app/utils/apiError.util";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

const mockRouterPush = vi.fn();
const mockSetStructure = vi.fn();
const mockSetFetchState = vi.fn();
const mockUpdateActualisation = vi.fn();

const actualisationForm = {
  id: 10,
  status: false,
  formDefinition: { slug: "actualisation-2026" },
  formSteps: [
    { id: 1, status: StepStatus.NON_COMMENCE, stepDefinition: { slug: "01-places" } },
    {
      id: 2,
      status: StepStatus.NON_COMMENCE,
      stepDefinition: { slug: "02-documents-financiers" },
    },
  ],
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock(
  "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext",
  () => ({
    useStructureContext: () => ({
      structure: { id: 1, forms: [actualisationForm] },
      setStructure: mockSetStructure,
    }),
  })
);
vi.mock("@/app/hooks/useStructures", () => ({
  useStructures: () => ({
    updateActualisation: (...args: unknown[]) => mockUpdateActualisation(...args),
  }),
}));
vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

const renderActualisation = (currentStep?: string) =>
  renderHook(() => useActualisationFormHandling({ year: 2026, currentStep }));

const stepStatus = (payload: unknown, slug: string): StepStatus | undefined => {
  const forms = (payload as { forms?: (typeof actualisationForm)[] }).forms;
  return forms?.[0]?.formSteps.find(
    (formStep) => formStep.stepDefinition.slug === slug
  )?.status;
};

describe("useActualisationFormHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateActualisation.mockResolvedValue(undefined);
  });

  it("auto-sauvegarde en posant VALIDE sur l'étape courante quand le schéma strict passe", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleAutoSave({}, z.string(), "valide");

    const [structureId, payload, setStructure] =
      mockUpdateActualisation.mock.calls[0];
    expect(structureId).toBe(1);
    expect(setStructure).toBe(mockSetStructure);
    expect(stepStatus(payload, "01-places")).toBe(StepStatus.VALIDE);
    // Les autres étapes ne sont pas touchées.
    expect(stepStatus(payload, "02-documents-financiers")).toBe(
      StepStatus.NON_COMMENCE
    );
  });

  it("auto-sauvegarde en posant NON_COMMENCE quand le schéma strict échoue", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleAutoSave({}, z.string(), 123);

    const [, payload] = mockUpdateActualisation.mock.calls[0];
    expect(stepStatus(payload, "01-places")).toBe(StepStatus.NON_COMMENCE);
  });

  it("valide l'étape puis navigue vers l'étape suivante", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleValidateStep({});

    const [, payload] = mockUpdateActualisation.mock.calls[0];
    expect(stepStatus(payload, "01-places")).toBe(StepStatus.VALIDE);
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/1/actualisation/2026/02-documents-financiers"
    );
  });

  it("valide l'actualisation en passant le form à status=true", async () => {
    const { result } = renderActualisation();

    await result.current.handleValidateActualisation();

    const [, payload] = mockUpdateActualisation.mock.calls[0];
    expect(payload.forms[0].status).toBe(true);
  });

  it("remonte l'erreur au toast et n'avance pas quand la sauvegarde échoue", async () => {
    mockUpdateActualisation.mockRejectedValueOnce(new ApiError("Boom", 400));
    const { result } = renderActualisation("01-places");

    await result.current.handleValidateStep({});

    expect(mockSetFetchState).toHaveBeenCalledWith(
      ACTUALISATION_SAVE_KEY,
      FetchState.ERROR,
      "Boom"
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
