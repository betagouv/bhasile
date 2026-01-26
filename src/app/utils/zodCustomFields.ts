import { z } from "zod";

const transformFrenchDateToISO = (
  val: string | undefined
): string | undefined => {
  if (val === undefined || val === "") {
    return undefined;
  }
  // If it's already ISO datetime, return as-is
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return val;
  }
  // If it's already ISO date, convert to datetime
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return `${val}T00:00:00.000Z`;
  }
  // If it's French format, convert to datetime
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [day, month, year] = val.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`;
  }
  return val;
};

export const frenchDateToISO = () =>
  z.string().transform(transformFrenchDateToISO).pipe(z.string().datetime());

export const frenchDateToYear = () =>
  z
    .string()
    .transform((val) => {
      if (!val) return undefined;
      // Expect "DD/MM/YYYY"
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const year = Number(match[3]);
        return isNaN(year) ? undefined : year;
      }
      // If already year string
      if (/^\d{4}$/.test(val)) {
        const year = Number(val);
        return isNaN(year) ? undefined : year;
      }
      return undefined;
    })
    .pipe(z.number().int().positive());

export const nullishFrenchDateToYear = () =>
  z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null) {
        return null;
      }
      if (val === undefined || val === "") {
        return undefined;
      }
      // Expect "DD/MM/YYYY"
      const match = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (match) {
        const year = Number(match[3]);
        return isNaN(year) ? undefined : year;
      }
      // If already year string
      if (typeof val === "string" && /^\d{4}$/.test(val)) {
        const year = Number(val);
        return isNaN(year) ? undefined : year;
      }
      return undefined;
    })
    .pipe(z.number().int().positive().nullish());

export const optionalFrenchDateToISO = () =>
  z
    .string()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      return transformFrenchDateToISO(val);
    })
    .pipe(z.string().datetime().optional());

export const nullishFrenchDateToISO = () =>
  z
    .string()
    .nullish()
    .transform((val) => {
      if (val === null) {
        return null;
      }
      if (val === undefined || val === "") {
        return undefined;
      }
      return transformFrenchDateToISO(val);
    })
    .pipe(z.string().datetime().nullish());

export const zSafeDecimalsNullish = () =>
  z.preprocess((val: unknown): number | null => {
    if (val === "" || val === null || val === undefined) {
      return null;
    }
    if (typeof val === "string") {
      const normalizedValue = val.replace(",", ".").replaceAll(" ", "");
      const parsed = Number(normalizedValue);
      return isNaN(parsed) ? null : parsed;
    }
    const parsed = Number(val);
    return isNaN(parsed) ? null : parsed;
  }, z.number().nullable());

export const zSafeYear = () =>
  z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z.number().int().positive()
  );

export const zSafeYearOptional = () =>
  z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z.number().int().positive().optional()
  );

export const zId = () =>
  z.preprocess((val) => (val === "" ? undefined : val), z.number().optional());
