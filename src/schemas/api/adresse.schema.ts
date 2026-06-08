import z from "zod";

import {
  zSafeStrictlyPositiveInteger,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { Repartition } from "@/types/adresse.type";

type AdresseTypologieApiRead = {
  id?: number;
  year: number;
  placesAutorisees: number;
  qpv: number;
  logementSocial: number;
};

export const adresseTypologieApiSchema = z
  .object({
    id: z.number().optional(),
    year: zSafeYear(),
    placesAutorisees: zSafeStrictlyPositiveInteger(),
    qpv: z.boolean().optional(),
    logementSocial: z.boolean().optional(),
  })
  .transform(
    (adresseTypologie): AdresseTypologieApiRead => ({
      id: adresseTypologie.id,
      year: adresseTypologie.year,
      placesAutorisees: adresseTypologie.placesAutorisees,
      qpv: adresseTypologie.qpv ? adresseTypologie.placesAutorisees : 0,
      logementSocial: adresseTypologie.logementSocial
        ? adresseTypologie.placesAutorisees
        : 0,
    })
  );

export const adresseApiSchema = z.object({
  id: z.number().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  commune: z.string().optional(),
  repartition: z.nativeEnum(Repartition).optional(),
  adresseTypologies: z.array(adresseTypologieApiSchema),
});

export type AdresseApiType = z.infer<typeof adresseApiSchema>;
export type AdresseTypologieApiType = z.infer<typeof adresseTypologieApiSchema>;
