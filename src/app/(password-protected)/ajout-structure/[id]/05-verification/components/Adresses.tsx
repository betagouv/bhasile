import { useParams } from "next/navigation";

import { Badge } from "@/app/components/common/Badge";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { TypeBatiAndAdressesFormValues } from "@/schemas/forms/base/adresse.schema";

export const Adresses = () => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<TypeBatiAndAdressesFormValues>
  >(`ajout-structure-${params.id}-adresses`, {});

  return (
    <>
      <div className="grid pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Type de bâti de la structure</b> {localStorageValues?.typeBati}
        </p>
      </div>
      {localStorageValues?.adresses &&
        localStorageValues.adresses.length > 0 && (
          <h3 className="text-title-blue-france w-full flex justify-between text-lg">
            Hébergements
          </h3>
        )}
      {localStorageValues?.adresses?.map((hebergement, index) => {
        return (
          <div
            key={`${index}-${hebergement.codePostal}`}
            className="flex gap-4 border-b border-default-grey pb-2 mb-3"
          >
            {hebergement?.adresseComplete && (
              <span>{hebergement?.adresseComplete}</span>
            )}
            {hebergement?.adresseTypologies?.[0]?.placesAutorisees && (
              <span>
                ({hebergement?.adresseTypologies?.[0]?.placesAutorisees} places)
              </span>
            )}
            {hebergement?.repartition && (
              <span>{hebergement?.repartition}</span>
            )}
            {hebergement?.adresseTypologies?.[0]?.qpv && (
              <Badge type="purple">QPV</Badge>
            )}
            {hebergement?.adresseTypologies?.[0]?.logementSocial && (
              <Badge type="purple">Logement social</Badge>
            )}
          </div>
        );
      })}
    </>
  );
};
