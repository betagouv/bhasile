import { NextRequest, NextResponse } from "next/server";

import { GLOBAL_FILTERS_COOKIE } from "../constants";
import { GLOBAL_FILTER_KEYS } from "../types/filters.type";
import { pickGlobalFilters } from "../utils/global-filters.util";

export const globalFiltersPages = [
  "/",
  "/structures",
  "/cpoms",
  "/operateurs",
  "/statistiques",
  "/statistiques/cartographie",
  "/ressources",
];

export const globalFiltersProxy = (request: NextRequest): NextResponse => {
  const { pathname, searchParams } = request.nextUrl;
  if (!globalFiltersPages.includes(pathname)) {
    return NextResponse.next();
  }

  const urlFilters = pickGlobalFilters(searchParams);
  const storedFilters = pickGlobalFilters(
    new URLSearchParams(request.cookies.get(GLOBAL_FILTERS_COOKIE)?.value)
  );
  const filters = new URLSearchParams(storedFilters);
  urlFilters.forEach((value, key) => filters.set(key, value));

  const isUrlUpToDate = GLOBAL_FILTER_KEYS.every(
    (key) => (searchParams.get(key) || null) === filters.get(key)
  );
  const response = isUrlUpToDate
    ? NextResponse.next()
    : NextResponse.redirect(buildRedirectUrl(request, filters));

  const isPrefetch =
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch";
  if (!isPrefetch && filters.toString() !== storedFilters.toString()) {
    response.cookies.set(GLOBAL_FILTERS_COOKIE, filters.toString(), {
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
};

const buildRedirectUrl = (
  request: NextRequest,
  filters: URLSearchParams
): URL => {
  const url = request.nextUrl.clone();
  GLOBAL_FILTER_KEYS.forEach((key) => {
    const value = filters.get(key);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  return url;
};
