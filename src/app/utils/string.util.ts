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
