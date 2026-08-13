import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTransformations } from "@/app/hooks/useTransformations";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { toJsonResponse } from "../test-utils/http.mock";

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

  it("renvoie la transformation fraîche depuis la réponse du PUT de sélection", async () => {
    // GIVEN — le PUT renvoie l'entité, il n'y a plus de relecture séparée
    const freshTransformation = {
      id: 12,
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [{ id: 999 }],
    };
    const mockedFetch = vi
      .fn()
      .mockResolvedValue(toJsonResponse(200, freshTransformation));
    global.fetch = mockedFetch;

    // WHEN
    const { result } = renderHook(() => useTransformations());
    const transformation = await result.current.resetTransformationSelection(
      12,
      SELECTION_INPUT
    );

    // THEN
    expect(transformation).toEqual(freshTransformation);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});
