import { z } from "zod";

import { formatDateToIsoString } from "./date.util";

export const frenchDateToISO = () =>
  z.string().transform(formatDateToIsoString).pipe(z.string().datetime());

export const frenchDateToYear = () =>
  z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === "number") {
        return val;
      }
      if (!val) {
        return undefined;
      }
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
    .union([z.string(), z.number()])
    .nullish()
    .transform((val) => {
      if (typeof val === "number") {
        return val;
      }
      if (val === null) {
        return null;
      }
      if (val === undefined || val === "") {
        return undefined;
      }
      // Expect "DD/MM/YYYY"
      if (typeof val === "string") {
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
      return formatDateToIsoString(val);
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
        return null;
      }
      return formatDateToIsoString(val);
    })
    .pipe(z.string().datetime().nullish());

const numberPreprocess = (val: unknown): number | null | undefined => {
  if (val === "" || val === null) {
    return null;
  }
  if (val === undefined) {
    return undefined;
  }
  if (typeof val === "string") {
    const normalizedValue = val.replace(",", ".").replaceAll(" ", "");
    const parsed = Number(normalizedValue);

    if (!isNaN(parsed)) {
      return parsed;
    }
  } else {
    const parsed = Number(val);

    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
};
export const zSafeDecimals = () => z.preprocess(numberPreprocess, z.number());

export const zSafePositiveDecimals = () =>
  z.preprocess(numberPreprocess, z.number().min(0));

export const zSafeDecimalsNullish = () =>
  z.preprocess(numberPreprocess, z.number().nullish());

export const zSafePositiveDecimalsNullish = () =>
  z.preprocess(numberPreprocess, z.number().min(0).nullish());

export const zSafePositiveInteger = () =>
  z.preprocess(numberPreprocess, z.number().int().min(0));

export const zSafePositiveIntegerNullish = () =>
  z.preprocess(numberPreprocess, z.number().int().min(0).nullish());

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
  z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : typeof val === "string"
          ? Number(val)
          : val,
    z.number().optional()
  );
