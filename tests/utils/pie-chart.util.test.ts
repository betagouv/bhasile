import { describe, expect, it } from "vitest";

import {
  computeCalloutLayout,
  computeSlices,
  extractSeriesValue,
  getAnchorRadius,
  getCalloutAngle,
  getCalloutElbow,
  getSeriesColors,
  polarToCartesian,
  sortIndexesByValue,
  stackLabelTops,
} from "@/utils/pie-chart.util";

describe("pie-chart.util", () => {
  describe("extractSeriesValue", () => {
    it("retourne la valeur d'une série numérique ou objet", () => {
      expect(extractSeriesValue(12)).toBe(12);
      expect(extractSeriesValue({ value: 7 })).toBe(7);
    });

    it("retourne 0 pour une série absente ou sans valeur numérique", () => {
      expect(extractSeriesValue(undefined)).toBe(0);
      expect(extractSeriesValue(null)).toBe(0);
    });
  });

  describe("getSeriesColors", () => {
    const colors = ["red", "green", "blue"];

    it("donne la troisième couleur à la deuxième série quand il y a deux séries", () => {
      expect(getSeriesColors(colors, 2)).toEqual(["red", "blue"]);
    });

    it("donne à chaque série la couleur de même rang au-delà de deux séries", () => {
      expect(getSeriesColors(colors, 3)).toEqual(["red", "green", "blue"]);
    });

    it("laisse sans couleur les séries au-delà de la palette", () => {
      expect(getSeriesColors(colors, 4)).toEqual([
        "red",
        "green",
        "blue",
        undefined,
      ]);
    });
  });

  describe("computeSlices", () => {
    it("répartit les valeurs sur le cercle dans le sens horaire depuis midi", () => {
      expect(computeSlices([25, 25, 50])).toEqual([
        { value: 25, startAngle: 0, endAngle: 90 },
        { value: 25, startAngle: 90, endAngle: 180 },
        { value: 50, startAngle: 180, endAngle: 360 },
      ]);
    });

    it("produit des segments vides quand le total est nul", () => {
      expect(computeSlices([0, 0])).toEqual([
        { value: 0, startAngle: 0, endAngle: 0 },
        { value: 0, startAngle: 0, endAngle: 0 },
      ]);
    });
  });

  describe("getCalloutAngle", () => {
    it("vise le milieu d'un segment entièrement dans la moitié droite", () => {
      expect(getCalloutAngle({ value: 1, startAngle: 0, endAngle: 90 })).toBe(
        45
      );
    });

    it("vise le milieu de la partie droite d'un segment à cheval", () => {
      expect(getCalloutAngle({ value: 1, startAngle: 90, endAngle: 270 })).toBe(
        135
      );
    });

    it("vise le bord bas d'un segment à gauche plus proche de 6 h que de midi", () => {
      expect(
        getCalloutAngle({ value: 1, startAngle: 200, endAngle: 250 })
      ).toBe(205);
    });

    it("vise le bord haut d'un segment à gauche plus proche de midi que de 6 h", () => {
      expect(
        getCalloutAngle({ value: 1, startAngle: 300, endAngle: 350 })
      ).toBe(345);
    });

    it("reste à l'intérieur d'un segment à gauche plus fin que la marge", () => {
      expect(
        getCalloutAngle({ value: 1, startAngle: 200, endAngle: 204 })
      ).toBe(202);
    });
  });

  describe("polarToCartesian", () => {
    it("place l'angle 0 en haut et l'angle 90 à droite", () => {
      const top = polarToCartesian({ x: 0, y: 0 }, 10, 0);
      const right = polarToCartesian({ x: 0, y: 0 }, 10, 90);

      expect(top.x).toBeCloseTo(0);
      expect(top.y).toBeCloseTo(-10);
      expect(right.x).toBeCloseTo(10);
      expect(right.y).toBeCloseTo(0);
    });
  });

  describe("getAnchorRadius", () => {
    it("vise le milieu de l'anneau d'un donut", () => {
      expect(getAnchorRadius(180, 30)).toBe(70);
    });

    it("vise la moitié du rayon d'un camembert plein", () => {
      expect(getAnchorRadius(60)).toBe(12.5);
    });
  });

  describe("stackLabelTops", () => {
    it("décale vers le bas un label qui chevauche le précédent", () => {
      expect(
        stackLabelTops({
          desiredTops: [10, 20, 100],
          heights: [24, 24, 24],
          gap: 8,
        })
      ).toEqual([10, 42, 100]);
    });

    it("laisse le premier label remonter au-dessus du graphique", () => {
      expect(
        stackLabelTops({ desiredTops: [-5], heights: [24], gap: 8 })
      ).toEqual([-5]);
    });
  });

  describe("getCalloutElbow", () => {
    const center = { x: 50, y: 50 };

    it("garde le point de sortie quand le label est à sa hauteur", () => {
      expect(
        getCalloutElbow({
          exit: { x: 80, y: 10 },
          lineY: 10,
          labelX: 200,
          center,
          clearanceRadius: 40,
        })
      ).toEqual({ x: 80, y: 10 });
    });

    it("place le coude juste à l'extérieur du cercle à la hauteur du label", () => {
      const elbow = getCalloutElbow({
        exit: { x: 80, y: 10 },
        lineY: 50,
        labelX: 200,
        center,
        clearanceRadius: 40,
      });

      expect(elbow).toEqual({ x: 90, y: 50 });
    });

    it("garde un segment horizontal minimal avant le label", () => {
      expect(
        getCalloutElbow({
          exit: { x: 80, y: 10 },
          lineY: 50,
          labelX: 95,
          center,
          clearanceRadius: 40,
        })
      ).toEqual({ x: 87, y: 50 });
    });
  });

  describe("sortIndexesByValue", () => {
    it("retourne les index triés par valeur croissante", () => {
      expect(sortIndexesByValue([30, -1, 10])).toEqual([1, 2, 0]);
    });
  });

  describe("computeCalloutLayout", () => {
    const layout = computeCalloutLayout({
      values: [31, 24, 45],
      size: 180,
      donutWidth: 30,
      labelHeights: [48, 72, 48],
      labelX: 204,
      labelGap: 8,
      firstLineCenter: 12,
    });
    const [indisponibles, caes, disponibles] = layout.items;

    it("ordonne les labels selon la hauteur de leur point", () => {
      expect(disponibles.top).toBeLessThan(indisponibles.top);
      expect(indisponibles.top).toBeLessThan(caes.top);
    });

    it("place le coude hors du donut, à la hauteur du label", () => {
      const line = indisponibles.line;
      const center = { x: 90, y: 90 + layout.chartTop };
      const distanceFromCenter = (point: { x: number; y: number }) =>
        Math.hypot(point.x - center.x, point.y - center.y);

      expect(distanceFromCenter(line!.anchor)).toBeCloseTo(70);
      expect(distanceFromCenter(line!.elbow)).toBeGreaterThanOrEqual(88 - 1e-9);
      expect(line!.elbow.y).toBe(line!.end.y);
    });

    it("fait passer au-dessus du donut le trait d'un segment proche de midi", () => {
      const line = disponibles.line;
      const donutTop = layout.chartTop + 5;

      expect(line!.end.y).toBeLessThan(donutTop);
      expect(line!.elbow.x).toBeLessThan(90);
    });

    it("descend le graphique quand un label remonte au-dessus", () => {
      expect(layout.chartTop).toBeGreaterThan(0);
      expect(Math.min(...layout.items.map(({ top }) => top))).toBe(0);
    });

    it("n'attribue pas de trait à une série nulle et la place à son départ", () => {
      const zeroLayout = computeCalloutLayout({
        values: [0, 50, 50],
        size: 100,
        donutWidth: 20,
        labelHeights: [24, 24, 24],
        labelX: 124,
        labelGap: 8,
        firstLineCenter: 12,
      });

      expect(zeroLayout.items[0].line).toBeNull();
      expect(zeroLayout.items[0].top).toBe(0);
    });

    it("englobe le graphique et tous les labels dans la hauteur", () => {
      const tallLayout = computeCalloutLayout({
        values: [50, 50],
        size: 100,
        donutWidth: 20,
        labelHeights: [24, 200],
        labelX: 124,
        labelGap: 8,
        firstLineCenter: 12,
      });

      expect(tallLayout.height).toBeGreaterThan(tallLayout.chartTop + 100);
    });
  });
});
