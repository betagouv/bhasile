import { NextRequest, NextResponse } from "next/server";

import { parseCommaList } from "../app/utils/string.util";
import { reduceToSingleZone } from "../app/utils/zone.util";
import { GLOBAL_FILTERS_COOKIE, INITIAL_ZONE_PARAM } from "../constants";
import { GLOBAL_FILTER_KEYS } from "../types/filters.type";
import { pickGlobalFilters } from "../utils/global-filters.util";

const CARTOGRAPHIE_PAGE = "/statistiques/cartographie";

export const globalFiltersPages = [
  "/",
  "/structures",
  "/cpoms",
  "/operateurs",
  "/statistiques",
  CARTOGRAPHIE_PAGE,
  "/ressources",
];

export const globalFiltersProxy = (request: NextRequest): NextResponse => {
  const { pathname, searchParams } = request.nextUrl;
  if (!globalFiltersPages.includes(pathname)) {
    return NextResponse.next();
  }

  const storedFilters = pickGlobalFilters(
    new URLSearchParams(request.cookies.get(GLOBAL_FILTERS_COOKIE)?.value)
  );
  const urlFilters = pickGlobalFilters(searchParams);
  const filters = new URLSearchParams(storedFilters);
  urlFilters.forEach((value, key) => filters.set(key, value));

  const persistedFilters = new URLSearchParams(filters);
  const displayedFilters = new URLSearchParams(filters);
  let initialZone: string | null = null;

  if (pathname === CARTOGRAPHIE_PAGE) {
    const storedDepartements = storedFilters.get("departements");
    if (storedDepartements) {
      persistedFilters.set("departements", storedDepartements);
    }
    const departements = parseCommaList(filters.get("departements"));
    const reducedDepartements = reduceToSingleZone(departements);
    if (reducedDepartements.length !== departements.length) {
      displayedFilters.set("departements", reducedDepartements.join(","));
      initialZone = departements.join(",");
    }
  }

  const isUrlUpToDate = GLOBAL_FILTER_KEYS.every(
    (key) => urlFilters.get(key) === displayedFilters.get(key)
  );
  const response = isUrlUpToDate
    ? NextResponse.next()
    : NextResponse.redirect(
        buildRedirectUrl(request, displayedFilters, initialZone)
      );

  response.cookies.set(GLOBAL_FILTERS_COOKIE, persistedFilters.toString(), {
    path: "/",
    sameSite: "lax",
  });
  return response;
};

const buildRedirectUrl = (
  request: NextRequest,
  displayedFilters: URLSearchParams,
  initialZone: string | null
): URL => {
  const url = request.nextUrl.clone();
  GLOBAL_FILTER_KEYS.forEach((key) => {
    const value = displayedFilters.get(key);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  if (initialZone) {
    url.searchParams.set(INITIAL_ZONE_PARAM, initialZone);
  }
  return url;
};
