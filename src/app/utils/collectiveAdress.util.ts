import { StructureApiType } from "@/schemas/api/structure.schema";
import { Repartition } from "@/types/adresse.type";

export const getCollectiveAddress = (structure: StructureApiType | null) => {
  const collectiveAddress =
    structure?.adresses &&
    structure.adresses.length === 1 &&
    structure.adresses[0].repartition?.toUpperCase() ===
      Repartition.COLLECTIF.toUpperCase()
      ? structure.adresses[0]
      : null;

  if (!collectiveAddress) {return null;}

  if (structure?.adresseAdministrative === collectiveAddress.adresse)
    {return null;}

  return collectiveAddress;
};
