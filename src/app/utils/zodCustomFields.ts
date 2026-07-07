import { z } from "zod";

import { formatDateToIsoString } from "./date.util";

export const frenchDateToISO = () =>
  z.string().transform(formatDateToIsoString).pipe(z.iso.datetime());

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
    .pipe(z.iso.datetime().optional());

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
    .pipe(z.iso.datetime().nullish());

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

export const zSafeStrictlyPositiveInteger = () =>
  z.preprocess(numberPreprocess, z.number().int().positive());

export const zSafePositiveIntegerNullish = () =>
  z.preprocess(numberPreprocess, z.number().int().min(0).nullish());

export const zSafeYear = () =>
  z.preprocess(
    (val) => (typeof val === "string" ? Number(val) : val),
    z.number().int().positive()
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

export const emptyValuesToUndefined = (value: unknown): unknown => {
  if (value === "" || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(emptyValuesToUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        emptyValuesToUndefined(nestedValue),
      ])
    );
  }
  return value;
};
