import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GLOBAL_FILTERS_COOKIE } from "@/constants";
import { globalFiltersProxy } from "@/proxy/global-filters";

const buildRequest = (
  path: string,
  storedFilters?: string,
  headers: Record<string, string> = {}
): NextRequest =>
  new NextRequest(`http://localhost${path}`, {
    headers: storedFilters
      ? {
          ...headers,
          cookie: `${GLOBAL_FILTERS_COOKIE}=${encodeURIComponent(storedFilters)}`,
        }
      : headers,
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

  it("retire de l'URL et ne mémorise pas un identifiant d'opérateur invalide", () => {
    const response = globalFiltersProxy(
      buildRequest("/structures?operateurs=Coallia,4", "types=CADA")
    );

    expect(getLocation(response)).toBe("/structures?operateurs=4&types=CADA");
    expect(getStoredFilters(response)).toBe("types=CADA&operateurs=4");
  });

  it("n'écrit pas le cookie quand les filtres n'ont pas changé", () => {
    const response = globalFiltersProxy(
      buildRequest("/cpoms?departements=75", "departements=75")
    );

    expect(getStoredFilters(response)).toBeUndefined();
  });

  it("n'écrit pas le cookie lors d'un préchargement", () => {
    const response = globalFiltersProxy(
      buildRequest("/cpoms?departements=92", "departements=75", {
        "next-router-prefetch": "1",
      })
    );

    expect(getStoredFilters(response)).toBeUndefined();
  });
});
