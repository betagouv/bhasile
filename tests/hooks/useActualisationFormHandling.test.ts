import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  CAMPAIGN_SAVE_KEY,
  useActualisationFormHandling,
} from "@/app/hooks/useActualisationFormHandling";
import { FetchState } from "@/types/fetch-state.type";
import { StepStatus } from "@/types/form.type";

const mockRouterPush = vi.fn();
const mockSetStructure = vi.fn();
const mockSetFetchState = vi.fn();
const mockUpdateAndRefreshCampaign = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
vi.mock(
  "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext",
  () => ({
    useStructureContext: () => ({
      structure: { id: 1 },
      setStructure: mockSetStructure,
    }),
  })
);
vi.mock("@/app/hooks/useCampaigns", () => ({
  useCampaigns: () => ({
    updateAndRefreshCampaign: (...args: unknown[]) =>
      mockUpdateAndRefreshCampaign(...args),
  }),
}));
vi.mock("@/app/context/FetchStateContext", () => ({
  useFetchState: () => ({ setFetchState: mockSetFetchState }),
}));

const renderActualisation = (currentStep?: string) =>
  renderHook(() =>
    useActualisationFormHandling({ year: 2026, currentStep })
  );

describe("useActualisationFormHandling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAndRefreshCampaign.mockResolvedValue("OK");
  });

  it("auto-sauvegarde avec le statut VALIDE quand le schéma strict passe", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleAutoSave({}, z.string(), "valide");

    expect(mockUpdateAndRefreshCampaign).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        structureId: 1,
        year: 2026,
        step: { slug: "01-places", status: StepStatus.VALIDE },
      }),
      mockSetStructure
    );
  });

  it("auto-sauvegarde avec NON_COMMENCE quand le schéma strict échoue", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleAutoSave({}, z.string(), 123);

    expect(mockUpdateAndRefreshCampaign).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        step: { slug: "01-places", status: StepStatus.NON_COMMENCE },
      }),
      mockSetStructure
    );
  });

  it("valide l'étape puis navigue vers l'étape suivante", async () => {
    const { result } = renderActualisation("01-places");

    await result.current.handleValidateStep({});

    expect(mockUpdateAndRefreshCampaign).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        step: { slug: "01-places", status: StepStatus.VALIDE },
      }),
      mockSetStructure
    );
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/1/actualisation/2026/02-documents-financiers"
    );
  });

  it("valide l'actualisation avec le flag validate", async () => {
    const { result } = renderActualisation();

    await result.current.handleValidateActualisation();

    expect(mockUpdateAndRefreshCampaign).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ validate: true }),
      mockSetStructure
    );
  });

  it("remonte l'erreur au toast et n'avance pas quand la sauvegarde échoue", async () => {
    mockUpdateAndRefreshCampaign.mockResolvedValueOnce("Boom");
    const { result } = renderActualisation("01-places");

    await expect(result.current.handleValidateStep({})).rejects.toThrow("Boom");

    expect(mockSetFetchState).toHaveBeenCalledWith(
      CAMPAIGN_SAVE_KEY,
      FetchState.ERROR,
      "Boom"
    );
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
