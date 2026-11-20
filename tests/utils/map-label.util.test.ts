import { describe, expect, it } from "vitest";

import { computeAreaCentroid } from "@/utils/map-label.util";

describe("computeAreaCentroid", () => {
  it("renvoie le centre d'un carré", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    expect(computeAreaCentroid(square)).toEqual({ x: 5, y: 5 });
  });

  it("donne le même résultat quel que soit le sens de parcours", () => {
    const clockwiseSquare = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];

    expect(computeAreaCentroid(clockwiseSquare)).toEqual({ x: 5, y: 5 });
  });

  it("attire le centre vers la partie la plus massive d'une forme en L", () => {
    const lShape = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 8 },
      { x: 10, y: 8 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];

    const centroid = computeAreaCentroid(lShape);

    expect(centroid?.x).toBeCloseTo(29 / 9);
    expect(centroid?.y).toBeCloseTo(61 / 9);
  });

  it("renvoie null pour une forme sans surface", () => {
    const segment = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];

    expect(computeAreaCentroid(segment)).toBeNull();
  });
});
