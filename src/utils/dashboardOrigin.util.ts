const ORIGIN_PARAM = "from";
const DASHBOARD_ORIGIN = "dashboard";
const DASHBOARD_HREF = "/";

type SearchParamsReader = Pick<URLSearchParams, "get">;

const isFromDashboard = (searchParams: SearchParamsReader): boolean =>
  searchParams.get(ORIGIN_PARAM) === DASHBOARD_ORIGIN;

export const addDashboardOrigin = (url: string): string => {
  const [pathAndQuery, hash] = url.split("#");
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const hashSuffix = hash === undefined ? "" : `#${hash}`;
  return `${pathAndQuery}${separator}${ORIGIN_PARAM}=${DASHBOARD_ORIGIN}${hashSuffix}`;
};

export const keepDashboardOrigin = (
  url: string,
  searchParams: SearchParamsReader
): string => (isFromDashboard(searchParams) ? addDashboardOrigin(url) : url);

export const getBackHref = (
  searchParams: SearchParamsReader,
  fallbackHref: string
): string => (isFromDashboard(searchParams) ? DASHBOARD_HREF : fallbackHref);
