import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { FILTERS_COOKIE } from "@/constants";
import { filtersProxy } from "@/proxy/filters";

const buildRequest = (
  path: string,
  storedFilters: string,
  headers: Record<string, string> = {}
): NextRequest =>
  new NextRequest(`http://localhost${path}`, {
    headers: {
      ...headers,
      cookie: `${FILTERS_COOKIE}=${encodeURIComponent(storedFilters)}`,
    },
  });

const getLocation = (response: Response): string | null =>
  response.headers.get("location")?.replace("http://localhost", "") ?? null;

const getStoredFilters = (
  response: ReturnType<typeof filtersProxy>
): string | undefined => response.cookies.get(FILTERS_COOKIE)?.value;

describe("filtersProxy", () => {
  it("complète l'URL avec les filtres mémorisés et mémorise ceux de l'URL", () => {
    const response = filtersProxy(
      buildRequest("/statistiques?operateurs=12", "departements=75&types=CADA")
    );

    expect(getLocation(response)).toBe(
      "/statistiques?operateurs=12&departements=75&types=CADA"
    );
    expect(getStoredFilters(response)).toBe(
      "departements=75&types=CADA&operateurs=12"
    );
  });

  it("retire de l'URL un identifiant d'opérateur invalide", () => {
    const response = filtersProxy(
      buildRequest("/structures?operateurs=Coallia", "")
    );

    expect(getLocation(response)).toBe("/structures");
    expect(getStoredFilters(response)).toBeUndefined();
  });

  it("n'écrit pas le cookie quand rien ne change ni lors d'un préchargement", () => {
    const unchanged = filtersProxy(
      buildRequest("/cpoms?departements=75", "departements=75")
    );
    const prefetch = filtersProxy(
      buildRequest("/cpoms?departements=92", "departements=75", {
        "next-router-prefetch": "1",
      })
    );

    expect(getStoredFilters(unchanged)).toBeUndefined();
    expect(getStoredFilters(prefetch)).toBeUndefined();
  });

  it("ignore les pages de détail", () => {
    const response = filtersProxy(
      buildRequest("/structures/12", "departements=75")
    );

    expect(getLocation(response)).toBeNull();
    expect(getStoredFilters(response)).toBeUndefined();
  });
});
