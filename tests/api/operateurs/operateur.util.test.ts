import { describe, expect, it } from "vitest";

import { OperateurListRow } from "@/app/api/operateurs/operateur.db.type";
import {
  buildOperateurListItem,
  buildTopLevelOperateurMap,
  filterOperateursBySearch,
  groupStructureStatsByOperateur,
  OperateurListItem,
} from "@/app/api/operateurs/operateur.util";
import { StructureType } from "@/types/structure.type";

const now = new Date("2025-01-01T00:00:00.000Z");

type StructureFixtureVersion = {
  effectiveDate: Date;
  type: StructureType | null;
  placesAutorisees: number | null;
};

let versionIdSeq = 0;

const makeStructure = (
  id: number,
  operateurId: number | null,
  version: StructureFixtureVersion | null
) => {
  versionIdSeq += 1;
  return {
    id,
    operateurId,
    type: version?.type ?? null,
    structureVersions: version
      ? [
          {
            id: versionIdSeq,
            effectiveDate: version.effectiveDate,
            structureVersionTransformationId: null,
            structureVersionTransformation: null,
            placesAutorisees: version.placesAutorisees,
          },
        ]
      : [],
  } as unknown as Parameters<typeof groupStructureStatsByOperateur>[0][number];
};

const currentVersion = (
  type: StructureType | null,
  placesAutorisees: number | null
): StructureFixtureVersion => ({
  effectiveDate: new Date("2020-01-01T00:00:00.000Z"),
  type,
  placesAutorisees,
});

const identityMap = (...operateurIds: number[]): Map<number, number> =>
  new Map(operateurIds.map((operateurId) => [operateurId, operateurId]));

const makeOperateur = (
  id: number,
  name: string,
  logoKey: string | null,
  parentId: number | null = null
): OperateurListRow =>
  ({
    id,
    name,
    parentId,
    logo: logoKey ? { key: logoKey } : null,
  }) as OperateurListRow;

describe("buildTopLevelOperateurMap", () => {
  it("associe chaque opérateur à son parent (filiale) ou à lui-même (tête de groupe)", () => {
    const map = buildTopLevelOperateurMap([
      makeOperateur(1, "Alpha", null),
      makeOperateur(2, "Filiale", null, 1),
    ]);
    expect(map.get(1)).toBe(1);
    expect(map.get(2)).toBe(1);
  });
});

describe("groupStructureStatsByOperateur", () => {
  it("compte, somme les places et dédoublonne les types par opérateur", () => {
    const { statsByOperateurId } = groupStructureStatsByOperateur(
      [
        makeStructure(1, 1, currentVersion(StructureType.CADA, 20)),
        makeStructure(2, 1, currentVersion(StructureType.HUDA, 10)),
        makeStructure(3, 1, currentVersion(StructureType.CADA, 5)),
        makeStructure(4, 2, currentVersion(StructureType.CADA, 30)),
      ],
      identityMap(1, 2),
      now
    );

    const operateurOne = statsByOperateurId.get(1);
    expect(operateurOne?.nbStructures).toBe(3);
    expect(operateurOne?.totalPlaces).toBe(35);
    expect([...(operateurOne?.structureTypes ?? [])]).toEqual([
      StructureType.CADA,
      StructureType.HUDA,
    ]);
    expect(statsByOperateurId.get(2)?.nbStructures).toBe(1);
  });

  it("remonte les structures de filiale dans la maison-mère", () => {
    const { statsByOperateurId, globalPlaces } = groupStructureStatsByOperateur(
      [
        makeStructure(1, 1, currentVersion(StructureType.CADA, 20)),
        makeStructure(2, 2, currentVersion(StructureType.HUDA, 30)),
      ],
      new Map([
        [1, 1],
        [2, 1],
      ]),
      now
    );

    const parent = statsByOperateurId.get(1);
    expect(parent?.nbStructures).toBe(2);
    expect(parent?.totalPlaces).toBe(50);
    expect([...(parent?.structureTypes ?? [])]).toEqual([
      StructureType.CADA,
      StructureType.HUDA,
    ]);
    expect(statsByOperateurId.get(2)).toBeUndefined();
    expect(globalPlaces).toBe(50);
  });

  it("inclut toutes les structures (même sans version courante) dans le dénominateur global et le compte, mais contribue 0 place", () => {
    const { statsByOperateurId, globalPlaces } = groupStructureStatsByOperateur(
      [
        makeStructure(1, 1, currentVersion(StructureType.CADA, 20)),
        makeStructure(2, 1, {
          effectiveDate: new Date("2099-01-01T00:00:00.000Z"),
          type: StructureType.HUDA,
          placesAutorisees: 999,
        }),
        makeStructure(3, null, currentVersion(StructureType.CADA, 40)),
      ],
      identityMap(1),
      now
    );

    const operateurOne = statsByOperateurId.get(1);
    expect(operateurOne?.nbStructures).toBe(2);
    expect(operateurOne?.totalPlaces).toBe(20);
    expect([...(operateurOne?.structureTypes ?? [])]).toEqual([
      StructureType.CADA,
    ]);
    expect(globalPlaces).toBe(60);
  });

  it("traite un placesAutorisees null du dernier millésime comme 0", () => {
    const { statsByOperateurId, globalPlaces } = groupStructureStatsByOperateur(
      [makeStructure(1, 1, currentVersion(StructureType.CADA, null))],
      identityMap(1),
      now
    );
    expect(statsByOperateurId.get(1)?.totalPlaces).toBe(0);
    expect(globalPlaces).toBe(0);
  });
});

describe("buildOperateurListItem", () => {
  it("calcule le pourcentage arrondi sur les places globales", () => {
    const item = buildOperateurListItem(
      makeOperateur(1, "Alpha", "logo-a"),
      {
        nbStructures: 2,
        totalPlaces: 1,
        structureTypes: new Set([StructureType.CADA]),
      },
      3
    );
    expect(item.pourcentageParc).toBe(33.33);
    expect(item.logo).toEqual({ key: "logo-a" });
    expect(item.structureTypes).toEqual([StructureType.CADA]);
  });

  it("renvoie 0 % quand le parc global est vide", () => {
    const item = buildOperateurListItem(
      makeOperateur(1, "Alpha", null),
      { nbStructures: 1, totalPlaces: 0, structureTypes: new Set() },
      0
    );
    expect(item.pourcentageParc).toBe(0);
    expect(item.logo).toEqual({ key: null });
  });
});

describe("filterOperateursBySearch", () => {
  const items: OperateurListItem[] = [
    {
      id: 1,
      name: "Forum réfugiés",
      nbStructures: 1,
      totalPlaces: 1,
      pourcentageParc: 1,
      structureTypes: [],
      logo: { key: null },
    },
    {
      id: 2,
      name: "Adoma",
      nbStructures: 1,
      totalPlaces: 1,
      pourcentageParc: 1,
      structureTypes: [],
      logo: { key: null },
    },
  ];

  it("renvoie tout quand pas de recherche", () => {
    expect(filterOperateursBySearch(items, null)).toHaveLength(2);
    expect(filterOperateursBySearch(items, "")).toHaveLength(2);
  });

  it("matche sans tenir compte de la casse ni des accents", () => {
    expect(
      filterOperateursBySearch(items, "refugies").map((operateur) => operateur.id)
    ).toEqual([1]);
    expect(
      filterOperateursBySearch(items, "ADOMA").map((operateur) => operateur.id)
    ).toEqual([2]);
  });
});
