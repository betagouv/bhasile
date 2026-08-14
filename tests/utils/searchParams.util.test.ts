import { describe, expect, it } from "vitest";

import {
  deletePaginationParams,
  setFilterParam,
} from "@/app/utils/searchParams.util";

describe("deletePaginationParams", () => {
  it("supprime le param page", () => {
    const params = new URLSearchParams("page=2&departements=50");
    deletePaginationParams(params);
    expect(params.get("page")).toBeNull();
    expect(params.get("departements")).toBe("50");
  });

  it("supprime tout param suffixé Page (ex. actualisationsPage)", () => {
    const params = new URLSearchParams("actualisationsPage=3&type=CADA");
    deletePaginationParams(params);
    expect(params.get("actualisationsPage")).toBeNull();
    expect(params.get("type")).toBe("CADA");
  });

  it("conserve les params qui ne relèvent pas de la pagination", () => {
    const params = new URLSearchParams("operateurs=1,2&search=foo");
    deletePaginationParams(params);
    expect(params.get("operateurs")).toBe("1,2");
    expect(params.get("search")).toBe("foo");
  });
});

describe("setFilterParam", () => {
  it("joint les valeurs par des virgules", () => {
    const params = new URLSearchParams();
    setFilterParam(params, "departements", ["75", "92"]);
    expect(params.get("departements")).toBe("75,92");
  });

  it("supprime le param quand la sélection est vide", () => {
    const params = new URLSearchParams("type=CADA");
    setFilterParam(params, "type", []);
    expect(params.get("type")).toBeNull();
  });

  it("ramène à la première page à chaque changement de filtre", () => {
    // GIVEN — l'agent est page 3 et filtre depuis une autre liste paginée
    const params = new URLSearchParams("page=3&rappelsPage=2&search=foo");

    // WHEN
    setFilterParam(params, "bati", ["DIFFUS"]);

    // THEN — sans ça, filtrer depuis une page élevée renvoie sur la dernière
    // page du résultat filtré au lieu de la première
    expect(params.get("page")).toBeNull();
    expect(params.get("rappelsPage")).toBeNull();
    expect(params.get("search")).toBe("foo");
  });

  it("accepte des valeurs numériques", () => {
    const params = new URLSearchParams();
    setFilterParam(params, "places", [10, 200]);
    expect(params.get("places")).toBe("10,200");
  });
});
