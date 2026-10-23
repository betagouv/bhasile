import { NextRequest, NextResponse } from "next/server";

import { GLOBAL_FILTERS_COOKIE } from "../constants";
import {
  hasGlobalFilters,
  pickGlobalFilters,
} from "../utils/global-filters.util";

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

  if (hasGlobalFilters(searchParams)) {
    const response = NextResponse.next();
    response.cookies.set(
      GLOBAL_FILTERS_COOKIE,
      pickGlobalFilters(searchParams).toString(),
      { path: "/", sameSite: "lax" }
    );
    return response;
  }

  const storedFilters = pickGlobalFilters(
    new URLSearchParams(request.cookies.get(GLOBAL_FILTERS_COOKIE)?.value)
  );
  if (storedFilters.size === 0) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  storedFilters.forEach((value, key) => url.searchParams.set(key, value));
  return NextResponse.redirect(url);
};
