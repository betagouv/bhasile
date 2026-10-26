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
  const filters = pickGlobalFilters(
    new URLSearchParams(request.cookies.get(GLOBAL_FILTERS_COOKIE)?.value)
  );
  urlFilters.forEach((value, key) => filters.set(key, value));

  const isUrlUpToDate = GLOBAL_FILTER_KEYS.every(
    (key) => urlFilters.get(key) === filters.get(key)
  );
  const response = isUrlUpToDate
    ? NextResponse.next()
    : NextResponse.redirect(buildRedirectUrl(request, filters));

  response.cookies.set(GLOBAL_FILTERS_COOKIE, filters.toString(), {
    path: "/",
    sameSite: "lax",
  });
  return response;
};

const buildRedirectUrl = (
  request: NextRequest,
  filters: URLSearchParams
): URL => {
  const url = request.nextUrl.clone();
  filters.forEach((value, key) => url.searchParams.set(key, value));
  return url;
};
