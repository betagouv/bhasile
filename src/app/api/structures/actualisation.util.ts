export const getActualisationYear = (): number | null => {
  const raw = process.env.ACTUALISATION_YEAR;
  if (!raw) {
    return null;
  }
  const year = Number(raw);
  return Number.isInteger(year) && year > 0 ? year : null;
};
