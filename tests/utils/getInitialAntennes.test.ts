import { describe, expect, it } from "vitest";

import { getInitialAntennes } from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import {
  createStructureVersionTransformation,
  createTransformation,
} from "../test-utils/factories/transformation.factory";

const makeAntenne = (name: string) => ({ name });

const createSvtWithAntennes = (
  type: StructureVersionTransformationType,
  structureAntennes: { name: string }[],
  versionAntennes: { name: string }[] = []
) =>
  createStructureVersionTransformation({
    type,
    structureVersion: {
      antennes: versionAntennes,
      structure: { codeBhasile: "", antennes: structureAntennes },
    },
  });

describe("getInitialAntennes", () => {
  it("retourne les antennes de la structure cible quand aucune règle prefill ne s'applique", () => {
    const extension = createSvtWithAntennes(
      StructureVersionTransformationType.EXTENSION,
      [makeAntenne("Base Nord")]
    );
    const transformation = createTransformation({
      type: TransformationType.EXTENSION_EX_NIHILO,
      structureVersionTransformations: [extension],
    });

    expect(
      getInitialAntennes(transformation, extension).map(
        (antenne) => antenne.name
      )
    ).toEqual(["Base Nord"]);
  });

  it("merge les antennes des structures sources selon les règles prefill", () => {
    const contraction = createSvtWithAntennes(
      StructureVersionTransformationType.CONTRACTION,
      [makeAntenne("Source Sud")]
    );
    const extension = createSvtWithAntennes(
      StructureVersionTransformationType.EXTENSION,
      [makeAntenne("Base Nord")]
    );
    const transformation = createTransformation({
      type: TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT,
      structureVersionTransformations: [contraction, extension],
    });

    expect(
      getInitialAntennes(transformation, extension).map(
        (antenne) => antenne.name
      )
    ).toEqual(["Base Nord", "Source Sud"]);
  });

  it("lit les antennes de structure (immuables), pas celles éditées de structureVersion", () => {
    const contraction = createSvtWithAntennes(
      StructureVersionTransformationType.CONTRACTION,
      [makeAntenne("Source originale")],
      [makeAntenne("Source éditée")]
    );
    const extension = createSvtWithAntennes(
      StructureVersionTransformationType.EXTENSION,
      [makeAntenne("Base originale")],
      [makeAntenne("Base éditée")]
    );
    const transformation = createTransformation({
      type: TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT,
      structureVersionTransformations: [contraction, extension],
    });

    expect(
      getInitialAntennes(transformation, extension).map(
        (antenne) => antenne.name
      )
    ).toEqual(["Base originale", "Source originale"]);
  });
});
