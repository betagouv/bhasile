import { NextRequest, NextResponse } from "next/server";

import { FILTERS_COOKIE } from "../constants";
import { FILTER_KEYS } from "../types/filters.type";
import { pickFilters } from "../utils/filters.util";

export const filtersPages = [
  "/",
  "/structures",
  "/cpoms",
  "/operateurs",
  "/statistiques",
  "/statistiques/cartographie",
  "/ressources",
];

export const filtersProxy = (request: NextRequest): NextResponse => {
  const { pathname, searchParams } = request.nextUrl;
  if (!filtersPages.includes(pathname)) {
    return NextResponse.next();
  }

  const urlFilters = pickFilters(searchParams);
  const storedFilters = pickFilters(
    new URLSearchParams(request.cookies.get(FILTERS_COOKIE)?.value)
  );
  const filters = new URLSearchParams(storedFilters);
  urlFilters.forEach((value, key) => filters.set(key, value));

  const isUrlUpToDate = FILTER_KEYS.every(
    (key) => (searchParams.get(key) || null) === filters.get(key)
  );
  const response = isUrlUpToDate
    ? NextResponse.next()
    : NextResponse.redirect(buildRedirectUrl(request, filters));

  const isPrefetch =
    request.headers.has("next-router-prefetch") ||
    request.headers.get("purpose") === "prefetch";
  if (!isPrefetch && filters.toString() !== storedFilters.toString()) {
    response.cookies.set(FILTERS_COOKIE, filters.toString(), {
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
  FILTER_KEYS.forEach((key) => {
    const value = filters.get(key);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  return url;
};
