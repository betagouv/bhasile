import z from "zod";

import { zId, zSafePositiveIntegerNullish } from "@/app/utils/zodCustomFields";
import { Repartition } from "@/types/adresse.type";

const adresseSchema = z.object({
  id: zId(),
  structureId: zId(),
  adresseComplete: z.string().optional(),
  adresse: z.string().min(1),
  codePostal: z.string().min(1),
  commune: z.string().min(1),
  departement: z.string().optional(),
  repartition: z.enum(Repartition),
  placesAutorisees: zSafePositiveIntegerNullish(),
  isQpv: z.boolean().optional(),
  isLogementSocial: z.boolean().optional(),
});

const adresseWithPlacesRequired = adresseSchema.check(
  z.superRefine((adresse, ctx) => {
    if (
      adresse.adresseComplete &&
      adresse.adresseComplete.trim() !== "" &&
      (adresse.placesAutorisees === undefined ||
        adresse.placesAutorisees === null ||
        adresse.placesAutorisees === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Requis",
        path: ["placesAutorisees"],
      });
    }
  })
);

const typeBatiSchema = z.object({
  typeBati: z.enum(Repartition),
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
        adresse.placesAutorisees !== undefined &&
        adresse.placesAutorisees !== null &&
        adresse.placesAutorisees !== 0
    );
  }, "Au moins une adresse doit avoir des places")
  .check(
    z.superRefine((data, ctx) => {
      if (data.typeBati !== Repartition.MIXTE) {
        return;
      }

      data.adresses.forEach((adresse, index) => {
        if (
          adresse.repartition !== Repartition.DIFFUS &&
          adresse.repartition !== Repartition.COLLECTIF
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Type de bâti requis",
            path: ["adresses", index, "repartition"],
          });
        }
      });
    })
  );

const adresseAutoSaveSchema = z.object({
  id: zId(),
  structureId: zId(),
  adresseComplete: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  commune: z.string().optional(),
  departement: z.string().optional(),
  repartition: z.enum(Repartition).optional(),
  placesAutorisees: zSafePositiveIntegerNullish(),
  isQpv: z.boolean().optional(),
  isLogementSocial: z.boolean().optional(),
});

export const typeBatiAndAdressesAutoSaveSchema = z.object({
  typeBati: z.enum(Repartition).optional(),
  sameAddress: z.boolean().optional(),
  adresses: z.array(adresseAutoSaveSchema).optional(),
});

export type FormAdresse = z.infer<typeof adresseSchema>;

export type TypeBatiAndAdressesFormValues = z.infer<
  typeof typeBatiAndAdressesSchema
>;
