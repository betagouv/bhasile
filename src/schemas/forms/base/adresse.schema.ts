import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";
import { Repartition } from "@/types/adresse.type";

export const adresseTypologieSchema = z.object({
  year: zSafeYear(),
  placesAutorisees: z
    .preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().min(0)
    )
    .optional(),
  qpv: z.boolean().optional(),
  logementSocial: z.boolean().optional(),
});

export const adresseSchema = z.object({
  id: zId(),
  structureId: zId(),
  adresseComplete: z.string().optional(),
  adresse: z.string().min(1),
  codePostal: z.string().min(1),
  commune: z.string().min(1),
  departement: z.string().optional(),
  repartition: z.nativeEnum(Repartition),
  adresseTypologies: z.array(adresseTypologieSchema).optional(),
});

export const adresseWithPlacesRequired = adresseSchema.superRefine(
  (adresse, ctx) => {
    if (
      adresse.adresseComplete &&
      adresse.adresseComplete.trim() !== "" &&
      (adresse.adresseTypologies?.[0]?.placesAutorisees === undefined ||
        adresse.adresseTypologies?.[0]?.placesAutorisees === null ||
        adresse.adresseTypologies?.[0]?.placesAutorisees === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requis",
        path: ["placesAutorisees"],
      });
    }
  }
);

export const typeBatiSchema = z.object({
  typeBati: z.nativeEnum(Repartition),
  sameAddress: z.boolean().optional(),
});

export const typeBatiAndAdressesSchema = typeBatiSchema
  .and(
    z.object({
      adresses: z.array(adresseWithPlacesRequired),
    })
  )
  .refine((data) => {
    return data.adresses.some(
      (adresse) =>
        adresse.adresseTypologies?.[0]?.placesAutorisees !== undefined
    );
  }, "Au moins une adresse doit avoir des places")
  .superRefine((data, ctx) => {
    if (data.typeBati !== Repartition.MIXTE) {
      return;
    }

    data.adresses.forEach((adresse, index) => {
      if (
        adresse.repartition !== Repartition.DIFFUS &&
        adresse.repartition !== Repartition.COLLECTIF
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Type de bâti requis",
          path: ["adresses", index, "repartition"],
        });
      }
    });
  });

export type FormAdresseTypologie = z.infer<typeof adresseTypologieSchema>;

export type FormAdresse = z.infer<typeof adresseSchema>;

export type TypeBatiAndAdressesFormValues = z.infer<
  typeof typeBatiAndAdressesSchema
>;
