export const toStatNumber = (value: number | null): number | null =>
  value == null ? null : Number(value.toFixed(1));

export const toStatRate = (value: number | null): number | null =>
  value == null ? null : Number(value.toFixed(3));
