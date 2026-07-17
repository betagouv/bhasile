export const getFirstParam = (
  value: string | string[] | undefined
): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

export const deletePaginationParams = (params: URLSearchParams): void => {
  for (const key of Array.from(params.keys())) {
    if (key === "page" || key.endsWith("Page")) {
      params.delete(key);
    }
  }
};
