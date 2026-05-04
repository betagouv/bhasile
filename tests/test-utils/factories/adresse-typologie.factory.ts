import { AdresseTypologieApiType } from "@/schemas/api/adresse.schema";

export const createAdresseTypologie = ({
  placesAutorisees,
}: CreateTypologiesArgs): AdresseTypologieApiType => {
  return {
    id: 1,
    placesAutorisees: placesAutorisees ?? 5,
    year: 2023,
    qpv: 3,
    logementSocial: 2,
  };
};

type CreateTypologiesArgs = {
  placesAutorisees?: number;
};
