import { useEffect, useState } from "react";

export const useStoredQueryParams = (basePath: string, storageKey: string) => {
  const [backHref, setBackHref] = useState(basePath);

  useEffect(() => {
    const storedQueryParams = sessionStorage.getItem(storageKey);
    if (storedQueryParams) {
      setBackHref(`${basePath}?${storedQueryParams}`);
    } else {
      setBackHref(basePath);
    }
  }, [basePath, storageKey]);

  return { backHref };
};
