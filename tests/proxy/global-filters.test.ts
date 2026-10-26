import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GLOBAL_FILTERS_COOKIE } from "@/constants";
import { globalFiltersProxy } from "@/proxy/global-filters";

const buildRequest = (path: string, storedFilters?: string): NextRequest =>
  new NextRequest(`http://localhost${path}`, {
    headers: storedFilters
      ? {
          cookie: `${GLOBAL_FILTERS_COOKIE}=${encodeURIComponent(storedFilters)}`,
        }
      : {},
  });

const getLocation = (response: Response): string | null =>
  response.headers.get("location")?.replace("http://localhost", "") ?? null;

const getStoredFilters = (
  response: ReturnType<typeof globalFiltersProxy>
): string | undefined => response.cookies.get(GLOBAL_FILTERS_COOKIE)?.value;

describe("globalFiltersProxy", () => {
  it("restaure les filtres mémorisés sur une page de niveau 1 sans filtre", () => {
    const response = globalFiltersProxy(
      buildRequest("/cpoms?page=2", "departements=75&types=CADA")
    );

    expect(getLocation(response)).toBe(
      "/cpoms?page=2&departements=75&types=CADA"
    );
  });

  it("fusionne un filtre partiel de l'URL avec les filtres mémorisés", () => {
    const response = globalFiltersProxy(
      buildRequest("/statistiques?operateurs=12", "departements=75&types=CADA")
    );

    expect(getLocation(response)).toBe(
      "/statistiques?operateurs=12&departements=75&types=CADA"
    );
    expect(getStoredFilters(response)).toBe(
      "departements=75&types=CADA&operateurs=12"
    );
  });

  it("laisse passer une URL déjà complète en mémorisant ses filtres", () => {
    const response = globalFiltersProxy(
      buildRequest("/structures?departements=92&vue=carte", "departements=75")
    );

    expect(getLocation(response)).toBeNull();
    expect(getStoredFilters(response)).toBe("departements=92");
  });

  it("laisse passer une page de niveau 1 quand aucun filtre n'est mémorisé", () => {
    const response = globalFiltersProxy(buildRequest("/statistiques"));

    expect(getLocation(response)).toBeNull();
  });

  it("ignore les pages de détail", () => {
    const response = globalFiltersProxy(
      buildRequest("/structures/12", "departements=75")
    );

    expect(getLocation(response)).toBeNull();
    expect(getStoredFilters(response)).toBeUndefined();
  });

  it("ne restaure que les clés de filtres globaux du cookie", () => {
    const response = globalFiltersProxy(
      buildRequest("/", "departements=75&redirect=evil")
    );

    expect(getLocation(response)).toBe("/?departements=75");
  });

  it("réduit la zone à une seule en cartographie sans toucher au filtre mémorisé", () => {
    const response = globalFiltersProxy(
      buildRequest("/statistiques/cartographie", "departements=50,33,14")
    );

    expect(getLocation(response)).toBe(
      "/statistiques/cartographie?departements=14&zoneInitiale=50%2C33%2C14"
    );
    expect(getStoredFilters(response)).toBe("departements=50%2C33%2C14");
  });

  it("garde la zone mémorisée quand la cartographie affiche la zone réduite", () => {
    const response = globalFiltersProxy(
      buildRequest(
        "/statistiques/cartographie?departements=14&indicateur=places.pmr",
        "departements=50,33,14"
      )
    );

    expect(getLocation(response)).toBeNull();
    expect(getStoredFilters(response)).toBe("departements=50%2C33%2C14");
  });
});
