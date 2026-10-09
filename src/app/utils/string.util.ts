const normalizeSearchText = (text: string): string => {
  return normalizeAccents(text)
    .toLowerCase()
    .replace(/[-_']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const matchesSearchQuery = (
  textToSearch: string,
  searchQuery: string
): boolean => {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  return normalizeSearchText(textToSearch).includes(normalizedQuery);
};

export const normalizeAccents = (stringToNormalize: string) => {
  return stringToNormalize
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\u0153/g, "oe")
    .replace(/\u00e6/g, "ae");
};

export const normalizeWords = (stringToNormalize: string): string =>
  normalizeAccents(stringToNormalize)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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

export const formatFirstWithRestCount = (
  items: string[]
): string | undefined => {
  const [first, ...rest] = items;
  if (first === undefined) {
    return undefined;
  }
  return rest.length > 0 ? `${first} +${rest.length}` : first;
};

export const parseId = (value: string): number | null =>
  /^\d+$/.test(value) ? Number(value) : null;

export const parseCommaList = (value: string | null | undefined): string[] =>
  value?.split(",").filter(Boolean) ?? [];
