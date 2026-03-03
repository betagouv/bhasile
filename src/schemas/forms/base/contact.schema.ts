import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const requiredContactSchema = z.object({
  id: zId(),
  prenom: z.string().nonempty("Le prénom est requis"),
  nom: z.string().nonempty("Le nom est requis"),
  role: z.string().nonempty("Le rôle est requis"),
  perimetre: z.string().optional(),
  email: z
    .string()
    .nonempty("Veuillez saisir une adresse email valide")
    .email("Veuillez saisir une adresse email valide"),
  telephone: z
    .string()
    .nonempty("Le téléphone est requis")
    .min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
});

export const optionalContactSchema = z
  .object({
    id: zId(),
    prenom: z.string().optional(),
    nom: z.string().optional(),
    role: z.string().optional(),
    perimetre: z.string().optional(),
    email: z.string().optional(),
    telephone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data) {
      return;
    }

    const { prenom, nom, role, perimetre, email, telephone } = data;

    const fields = [
      { name: "prenom", value: prenom, message: "Le prénom est requis" },
      { name: "nom", value: nom, message: "Le nom est requis" },
      { name: "role", value: role, message: "Le rôle est requis" },
      {
        name: "perimetre",
        value: perimetre,
        message: "Le périmètre est requis",
      },
      {
        name: "email",
        value: email,
        message: "Veuillez saisir une adresse email valide",
      },
      {
        name: "telephone",
        value: telephone,
        message: "Le téléphone est requis",
      },
    ];

    const filledFields = fields.filter(
      (field) => field.value !== undefined && field.value !== ""
    );

    if (filledFields.length === 0) {
      return;
    }

    if (filledFields.length > 0 && filledFields.length < fields.length) {
      fields.forEach((field) => {
        if (!field.value || field.value === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: field.message,
            path: [field.name],
          });
        }
      });
    }

    if (filledFields.length > 0 && telephone && telephone.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le numéro de téléphone doit contenir 10 caractères",
        path: ["telephone"],
      });
    }
  });

export const contactSchema = Object.assign(requiredContactSchema, {
  optional: () => optionalContactSchema,
});

export const contactsSchema = z.object({
  contacts: z
    .tuple([requiredContactSchema, requiredContactSchema])
    .rest(optionalContactSchema),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
