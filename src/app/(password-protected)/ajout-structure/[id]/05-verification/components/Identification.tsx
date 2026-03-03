import { useParams } from "next/navigation";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { formatCityName } from "@/app/utils/adresse.util";
import { formatPhoneNumber } from "@/app/utils/phone.util";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";

export const Identification = () => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.id}-identification`, {});

  return (
    <>
      <h3 className="text-title-blue-france w-full flex justify-between text-lg">
        Description
      </h3>
      <div className="grid grid-cols-2 border-b border-default-grey pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Opérateur</b> {localStorageValues?.operateur?.name}
        </p>
        <p className="flex gap-4 mb-0">
          <b>Date de création</b> {localStorageValues?.creationDate}
        </p>
      </div>
      <div className="grid grid-cols-2 border-b border-default-grey pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Public</b> {localStorageValues?.public}
        </p>
        {(localStorageValues?.lgbt || localStorageValues?.fvvTeh) && (
          <p className="flex gap-4 mb-0">
            <b>Vulnérabilité</b> {localStorageValues?.lgbt && "LGBT"}{" "}
            {localStorageValues?.fvvTeh && "FVV-TEH"}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 border-b border-default-grey pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Adresse administrative principale</b>{" "}
          <span>
            {localStorageValues?.nom},{" "}
            {localStorageValues?.adresseAdministrative}{" "}
            {localStorageValues?.codePostalAdministratif}{" "}
            {formatCityName(localStorageValues?.communeAdministrative ?? "")}
          </span>
        </p>
      </div>
      {localStorageValues?.antennes &&
        localStorageValues?.antennes.length > 0 && (
          <>
            <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
              Antennes
            </h3>
            {localStorageValues?.antennes.map((antenne) => (
              <div
                className="flex gap-4 border-b border-default-grey pb-2 mb-3"
                key={antenne.id}
              >
                <span className="italic">{antenne.name}</span>
                <span>
                  {antenne.adresse} {antenne.codePostal}{" "}
                  {formatCityName(antenne.commune)}
                </span>
              </div>
            ))}
          </>
        )}
      <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
        Codes DNA
      </h3>
      {localStorageValues?.dnaStructures?.map((dnaStructure) => (
        <div
          className="border-b border-default-grey flex gap-4  pb-2 mb-3"
          key={dnaStructure.dna.code}
        >
          <span className="italic">{dnaStructure.dna.code}</span>{" "}
          <span>{dnaStructure.dna.description}</span>
        </div>
      ))}
      <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
        Codes FINESS
      </h3>
      {localStorageValues?.finesses?.map((finess) => (
        <div
          className="border-b border-default-grey flex gap-4 pb-2 mb-3"
          key={finess.code}
        >
          <span className="italic">{finess.code}</span>{" "}
          <span>{finess.description}</span>
        </div>
      ))}
      <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
        Contacts
      </h3>
      {localStorageValues?.contacts?.map((contact) => (
        <div
          className="flex gap-4  border-b border-default-grey pb-2 mb-3"
          key={contact?.email}
        >
          {(contact?.nom || contact?.prenom) && (
            <span className="italic">
              {contact?.prenom} {contact?.nom}
            </span>
          )}

          {contact?.role && (
            <span>
              {contact?.role}{" "}
              {contact?.perimetre && <span>({contact?.perimetre})</span>}
            </span>
          )}
          {contact?.email && <span>{contact?.email}</span>}
          {contact?.telephone && (
            <span>{formatPhoneNumber(contact?.telephone)}</span>
          )}
        </div>
      ))}

      <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
        Calendrier
      </h3>

      <div className="border-b border-default-grey pb-2 mb-3">
        <p className="mb-0">
          <b className="pr-4">Période d’autorisation en cours</b>
          {localStorageValues?.debutPeriodeAutorisation && (
            <span>{localStorageValues?.debutPeriodeAutorisation}</span>
          )}
          {localStorageValues?.finPeriodeAutorisation && (
            <span> - {localStorageValues?.finPeriodeAutorisation}</span>
          )}
        </p>
      </div>
      <div className="border-b border-default-grey pb-2 mb-3">
        <p className="mb-0">
          <b className="pr-4">Convention en cours</b>
          {localStorageValues?.debutConvention && (
            <span>{localStorageValues?.debutConvention}</span>
          )}
          {localStorageValues?.finConvention && (
            <span> - {localStorageValues?.finConvention}</span>
          )}
        </p>
      </div>
    </>
  );
};
