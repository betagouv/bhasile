import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useStructureSelections } from "@/app/hooks/useStructureSelections";
import { StructureType } from "@/types/structure.type";
import { TransformationType } from "@/types/transformation.type";

const departureFilters = {
  structureType: StructureType.CADA,
  operateurName: "Adoma",
  departementNumero: "75",
};

describe("useStructureSelections", () => {
  it("préremplit les filtres des blocs avec ceux de la structure de départ", () => {
    const { result } = renderHook(() =>
      useStructureSelections({
        transformationType:
          TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES,
        structureId: 1,
        defaultFilters: departureFilters,
      })
    );

    const [block] = result.current.blocks;
    expect(result.current.filtersByBlock[block.id]).toEqual(departureFilters);
  });

  it("laisse modifier un filtre prérempli", () => {
    const { result } = renderHook(() =>
      useStructureSelections({
        transformationType:
          TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES,
        structureId: 1,
        defaultFilters: departureFilters,
      })
    );
    const [block] = result.current.blocks;

    act(() => {
      result.current.setFilter(block.id, "departementNumero", "92");
      result.current.setFilter(block.id, "structureType", StructureType.HUDA);
    });

    expect(result.current.filtersByBlock[block.id]).toMatchObject({
      departementNumero: "92",
      operateurName: "Adoma",
    });
    expect(result.current.getEffectiveStructureType(block)).toBe(
      StructureType.HUDA
    );
  });

  it("laisse les filtres du bloc CADA vides et indépendants du bloc HUDA", () => {
    const { result } = renderHook(() =>
      useStructureSelections({
        transformationType:
          TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
      })
    );

    act(() => {
      result.current.setFilter("huda", "operateurName", "Adoma");
      result.current.setFilter("huda", "departementNumero", "75");
    });

    expect(result.current.filtersByBlock.cada).toEqual({});
  });

  it("impose le type fixe du bloc quel que soit le filtre choisi", () => {
    const { result } = renderHook(() =>
      useStructureSelections({
        transformationType:
          TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
      })
    );
    const cadaBlock = result.current.blocks.find(
      (block) => block.id === "cada"
    );
    if (!cadaBlock) {
      throw new Error("Le bloc cada devrait exister");
    }

    act(() => {
      result.current.setFilter("cada", "structureType", StructureType.HUDA);
    });

    expect(result.current.getEffectiveStructureType(cadaBlock)).toBe(
      StructureType.CADA
    );
  });

  it("réinitialise sélection et filtres quand le type de transformation change", () => {
    const { result, rerender } = renderHook(
      ({ transformationType }) =>
        useStructureSelections({
          transformationType,
          structureId: 1,
          defaultFilters: departureFilters,
        }),
      {
        initialProps: {
          transformationType:
            TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE as TransformationType,
        },
      }
    );

    act(() => {
      result.current.setSelectedStructureIds("main", [42]);
      result.current.setFilter("main", "departementNumero", "92");
    });

    rerender({
      transformationType:
        TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES,
    });

    expect(result.current.selectedStructureIdsByBlock).toEqual({});
    expect(result.current.filtersByBlock.main).toEqual(departureFilters);
  });
});
