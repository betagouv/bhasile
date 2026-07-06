import { z } from "zod";

z.config({
  localeError: z.locales.fr().localeError,
  customError: (issue) => {
    if (issue.input === undefined || issue.input === null) {
      return "Ce champ est requis";
    }
    return undefined;
  },
});
