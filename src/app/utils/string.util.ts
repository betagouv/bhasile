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

export const pluralize = (count: number | undefined, noun: string): string =>
  `${noun}${(count ?? 0) > 1 ? "s" : ""}`;

export const formatPlural = (count: number | undefined, noun: string): string =>
  `${count ?? 0} ${pluralize(count, noun)}`;

export const parseCommaList = (value: string | null | undefined): string[] =>
  value?.split(",").filter(Boolean) ?? [];
