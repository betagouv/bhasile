import { AdresseApiType } from "@/schemas/api/adresse.schema";
import { Repartition } from "@/types/adresse.type";

export const createAdresse = ({
  id,
  adresse,
  commune,
  placesAutorisees,
  isQpv,
  isLogementSocial,
  repartition,
}: CreateLogementsArgs): AdresseApiType => {
  return {
    id: id ?? 1,
    adresse: adresse ?? "1, rue de la République",
    codePostal: "75001",
    commune: commune ?? "Paris",
    repartition: repartition ?? Repartition.DIFFUS,
    placesAutorisees,
    isQpv: isQpv ?? false,
    isLogementSocial: isLogementSocial ?? false,
  };
};

type CreateLogementsArgs = {
  id?: number;
  adresse?: string;
  commune?: string;
  placesAutorisees?: number;
  isQpv?: boolean;
  isLogementSocial?: boolean;
  repartition?: Repartition;
};
