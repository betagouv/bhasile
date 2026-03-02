import { useParams } from "next/navigation";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { formatPhoneNumber } from "@/app/utils/phone.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";

export const Identification = () => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutIdentificationFormValues>
  >(`ajout-structure-${params.dnaCode}-identification`, {});

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
        {isStructureAutorisee(localStorageValues?.type) && (
          <p className="flex gap-4 mb-0">
            <b>Code FINESS</b> {localStorageValues?.finessCode}
          </p>
        )}
        <p className="flex gap-4 mb-0">
          <b>Public</b> {localStorageValues?.public}
        </p>
      </div>
      <div className="grid grid-cols-2 border-b border-default-grey pb-2 mb-3">
        {(localStorageValues?.lgbt || localStorageValues?.fvvTeh) && (
          <p className="flex gap-4 mb-0">
            <b>Vulnérabilité</b> {localStorageValues?.lgbt && "LGBT"}{" "}
            {localStorageValues?.fvvTeh && "FVV-TEH"}
          </p>
        )}
      </div>
      <h3 className="text-title-blue-france w-full flex justify-between text-lg mt-10">
        Contacts
      </h3>
      <div className="border-b border-default-grey pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Contact principal</b>
          {(localStorageValues?.contactPrincipal?.nom ||
            localStorageValues?.contactPrincipal?.prenom) && (
            <span>
              {localStorageValues?.contactPrincipal?.prenom}{" "}
              {localStorageValues?.contactPrincipal?.nom}
            </span>
          )}

          {localStorageValues?.contactPrincipal?.role && (
            <span>({localStorageValues?.contactPrincipal?.role})</span>
          )}
          {localStorageValues?.contactPrincipal?.email && (
            <span>{localStorageValues?.contactPrincipal?.email}</span>
          )}
          {localStorageValues?.contactPrincipal?.telephone && (
            <span>
              {formatPhoneNumber(
                localStorageValues?.contactPrincipal?.telephone
              )}
            </span>
          )}
        </p>
      </div>
      <div className="border-b border-default-grey pb-2 mb-3">
        <p className="flex gap-4 mb-0">
          <b>Contact secondaire</b>
          {(localStorageValues?.contactSecondaire?.nom ||
            localStorageValues?.contactSecondaire?.prenom) && (
            <span>
              {localStorageValues?.contactSecondaire?.prenom}{" "}
              {localStorageValues?.contactSecondaire?.nom}
            </span>
          )}
          {localStorageValues?.contactSecondaire?.role && (
            <span>({localStorageValues?.contactSecondaire?.role})</span>
          )}
          {localStorageValues?.contactSecondaire?.email && (
            <span>{localStorageValues?.contactSecondaire?.email}</span>
          )}
          {localStorageValues?.contactSecondaire?.telephone && (
            <span>
              {formatPhoneNumber(
                localStorageValues?.contactSecondaire?.telephone
              )}
            </span>
          )}
        </p>
      </div>

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
