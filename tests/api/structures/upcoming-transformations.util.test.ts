import { describe, expect, it } from "vitest";

import { StructureDbDetails } from "@/app/api/structures/structure.db.type";
import { buildUpcomingTransformations } from "@/app/api/structures/structure.util";
import { StructureVersionTransformationType } from "@/types/transformation.type";

const NOW = new Date("2026-06-29T12:00:00.000Z");

type VersionStub = {
  id: number;
  effectiveDate: Date | null;
  structureVersionTransformationId: number | null;
  structureVersionTransformation: {
    type: StructureVersionTransformationType;
    transformation: { form: { status: boolean } | null } | null;
  } | null;
};

const makeVersion = (
  id: number,
  effectiveDate: Date | null,
  options: {
    type?: StructureVersionTransformationType;
    status?: boolean;
    withTransformation?: boolean;
  } = {}
): VersionStub => {
  const withTransformation = options.withTransformation ?? true;
  return {
    id,
    effectiveDate,
    structureVersionTransformationId: withTransformation ? id : null,
    structureVersionTransformation: withTransformation
      ? {
          type: options.type ?? StructureVersionTransformationType.EXTENSION,
          transformation: { form: { status: options.status ?? true } },
        }
      : null,
  };
};

const makeStructure = (versions: VersionStub[]): StructureDbDetails =>
  ({ structureVersions: versions }) as unknown as StructureDbDetails;

describe("buildUpcomingTransformations", () => {
  it("garde uniquement les transfos futures et finalisées", () => {
    const structure = makeStructure([
      makeVersion(1, new Date("2025-01-01T00:00:00.000Z")), // passé
      makeVersion(2, NOW), // aujourd'hui → courant, pas futur
      makeVersion(3, new Date("2026-11-17T00:00:00.000Z")), // futur finalisé
      makeVersion(4, new Date("2026-12-01T00:00:00.000Z"), { status: false }), // futur brouillon
      makeVersion(5, new Date("2027-01-01T00:00:00.000Z"), {
        withTransformation: false,
      }), // futur campagne (pas de transfo)
    ]);

    const result = buildUpcomingTransformations(structure, NOW);

    expect(result).toEqual([
      {
        kind: StructureVersionTransformationType.EXTENSION,
        date: "2026-11-17T00:00:00.000Z",
      },
    ]);
  });

  it("trie par date croissante (la plus proche en premier)", () => {
    const structure = makeStructure([
      makeVersion(1, new Date("2027-03-01T00:00:00.000Z"), {
        type: StructureVersionTransformationType.FERMETURE,
      }),
      makeVersion(2, new Date("2026-09-01T00:00:00.000Z"), {
        type: StructureVersionTransformationType.CONTRACTION,
      }),
    ]);

    const result = buildUpcomingTransformations(structure, NOW);

    expect(result.map((transformation) => transformation.date)).toEqual([
      "2026-09-01T00:00:00.000Z",
      "2027-03-01T00:00:00.000Z",
    ]);
  });
});
