export const matchesPath = (pathname: string | null, base: string): boolean =>
  base === "/"
    ? pathname === "/"
    : pathname === base || Boolean(pathname?.startsWith(`${base}/`));
