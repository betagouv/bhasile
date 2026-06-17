export const normalizeAccents = (stringToNormalize: string) => {
  return stringToNormalize
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export const capitalizeFirstLetter = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "";
  }
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

export const lowercaseFirstLetter = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "";
  }
  return String(value).charAt(0).toLowerCase() + String(value).slice(1);
};

export const areCodesUnique = <T>(
  items: T[] | undefined,
  getCode: (item: T) => string | null | undefined
): boolean => {
  const normalizedCodes = (items ?? [])
    .map((item) => getCode(item)?.trim())
    .filter((code): code is string => Boolean(code));
  return normalizedCodes.length === new Set(normalizedCodes).size;
};
