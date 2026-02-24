import { z } from "zod";

// Define the type based on Zod's type structure
type ErrorMapCtx = z.ErrorMapCtx;

// French error messages for Zod
export const frenchErrorMap = (
  issue: z.ZodIssueOptionalMessage,
  ctx: ErrorMapCtx
): { message: string } => {
  // Default error message in French
  let message = "Champ invalide";

  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null") {
        message = "Ce champ est requis";
      } else {
        message = `Type attendu : ${issue.expected}, reçu : ${issue.received}`;
      }
      break;
    case "invalid_literal":
      message = `Valeur invalide (${issue.received}), valeur attendue : ${JSON.stringify(
        issue.expected
      )}`;
      break;
    case "unrecognized_keys":
      message = `Clé(s) non reconnue(s) : ${issue.keys?.join(", ")}`;
      break;
    case "invalid_union":
      message = "Entrée invalide";
      break;
    case "invalid_union_discriminator":
      message = `Valeur discriminante invalide, attendue : ${issue.options?.join(
        ", "
      )}`;
      break;
    case "invalid_enum_value":
      message = `Valeur invalide (${issue.received}), attendue : ${issue.options?.join(" | ")}`;
      break;
    case "invalid_arguments":
      message = "Arguments de fonction invalides";
      break;
    case "invalid_return_type":
      message = "Type de retour de fonction invalide";
      break;
    case "invalid_date":
      message = "Date invalide";
      break;
    case "invalid_string":
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `La chaîne doit inclure "${issue.validation.includes}"`;
        } else if ("startsWith" in issue.validation) {
          message = `La chaîne doit commencer par "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `La chaîne doit se terminer par "${issue.validation.endsWith}"`;
        }
      } else if (issue.validation !== "regex") {
        message = `Chaîne ${issue.validation} invalide`;
      } else {
        message = "Format invalide";
      }
      break;
    case "too_small":
      if (issue.type === "array") {
        message = `Doit contenir au moins ${issue.minimum} élément(s)`;
      } else if (issue.type === "string") {
        message = `Doit contenir au moins ${issue.minimum} caractère(s)`;
      } else if (issue.type === "number") {
        message = `Doit être supérieur ou égal à ${issue.minimum}`;
      } else {
        message = "Valeur trop petite";
      }
      break;
    case "too_big":
      if (issue.type === "array") {
        message = `Doit contenir au maximum ${issue.maximum} élément(s)`;
      } else if (issue.type === "string") {
        message = `Doit contenir au maximum ${issue.maximum} caractère(s)`;
      } else if (issue.type === "number") {
        message = `Doit être inférieur ou égal à ${issue.maximum}`;
      } else {
        message = "Valeur trop grande";
      }
      break;
    case "custom":
      message = "Validation échouée";
      break;
    case "invalid_intersection_types":
      message =
        "Les résultats de l'intersection ne pouvaient pas être fusionnés";
      break;
    case "not_multiple_of":
      message = `Doit être un multiple de ${issue.multipleOf}`;
      break;
    case "not_finite":
      message = "Nombre non fini";
      break;
    default:
      message = ctx.defaultError;
  }

  return { message };
};

// Set the error map globally
z.setErrorMap(frenchErrorMap);
