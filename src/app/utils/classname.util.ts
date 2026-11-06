import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges class names using clsx and tailwind-merge.
 * This utility helps manage conditional class names and prevents duplicate Tailwind classes.
 */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const INCOMPLETE_CHECKBOX_CLASSNAME =
  "[&>label:before]:bg-none [&:before]:content-[''] [&:before]:absolute [&:before]:z-10 [&:before]:top-1/2 [&:before]:-translate-y-1/2 [&:before]:left-1 [&:before]:w-2 [&:before]:h-[1px] [&:before]:bg-white";
