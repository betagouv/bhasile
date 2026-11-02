export const matchesPath = (pathname: string | null, url: string): boolean =>
  url === "/"
    ? pathname === "/"
    : pathname === url || Boolean(pathname?.includes(url));
