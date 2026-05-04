import {
  AdresseApiType,
  AdresseTypologieApiType,
} from "@/schemas/api/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const createAdresse = ({
  id,
  adresse,
  commune,
  typologies,
  repartition,
}: CreateLogementsArgs): AdresseApiType => {
  return {
    id: id ?? 1,
    adresse: adresse ?? "1, rue de la République",
    codePostal: "75001",
    commune: commune ?? "Paris",
    repartition: repartition ?? Repartition.DIFFUS,
    adresseTypologies: typologies ?? [],
  };
};

type CreateLogementsArgs = {
  id?: number;
  adresse?: string;
  commune?: string;
  typologies?: AdresseTypologieApiType[];
  repartition?: Repartition;
};
