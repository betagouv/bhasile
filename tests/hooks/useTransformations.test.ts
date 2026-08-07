import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTransformations } from "@/app/hooks/useTransformations";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { toJsonResponse } from "../test-utils/http.mock";

const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRouterRefresh }),
}));

const SELECTION_INPUT = {
  type: TransformationType.FERMETURE_SANS_TRANSFERT,
  structureVersionTransformations: [
    {
      type: StructureVersionTransformationType.FERMETURE,
      structureVersion: { structureId: 7 },
    },
  ],
};

describe("useTransformations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rafraîchit le rendu serveur après updateTransformation", async () => {
    // GIVEN
    global.fetch = vi
      .fn()
      .mockResolvedValue(toJsonResponse(200, { transformationId: 12 }));

    // WHEN
    const { result } = renderHook(() => useTransformations());
    await result.current.updateTransformation(12, { id: 12 });

    // THEN
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });

  it("renvoie la transformation fraîche et rafraîchit après resetTransformationSelection", async () => {
    // GIVEN
    const freshTransformation = {
      id: 12,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [{ id: 999 }],
    };
    global.fetch = vi
      .fn()
      .mockResolvedValue(toJsonResponse(200, freshTransformation));

    // WHEN
    const { result } = renderHook(() => useTransformations());
    const transformation = await result.current.resetTransformationSelection(
      12,
      SELECTION_INPUT
    );

    // THEN
    expect(transformation).toEqual(freshTransformation);
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
  });
});
