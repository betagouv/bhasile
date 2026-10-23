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

describe("globalFiltersProxy", () => {
  it("restaure les filtres mémorisés sur une page de niveau 1 sans filtre", () => {
    const response = globalFiltersProxy(
      buildRequest("/cpoms?page=2", "departements=75&types=CADA")
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/cpoms?page=2&departements=75&types=CADA"
    );
  });

  it("mémorise les filtres présents dans l'URL sans rediriger", () => {
    const response = globalFiltersProxy(
      buildRequest("/structures?operateurs=4&vue=carte", "departements=75")
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get(GLOBAL_FILTERS_COOKIE)?.value).toBe(
      "operateurs=4"
    );
  });

  it("laisse passer une page de niveau 1 quand aucun filtre n'est mémorisé", () => {
    const response = globalFiltersProxy(buildRequest("/statistiques"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("ignore les pages de détail", () => {
    const response = globalFiltersProxy(
      buildRequest("/structures/12", "departements=75")
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("ne restaure que les clés de filtres globaux du cookie", () => {
    const response = globalFiltersProxy(
      buildRequest("/", "departements=75&redirect=evil")
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/?departements=75"
    );
  });
});
