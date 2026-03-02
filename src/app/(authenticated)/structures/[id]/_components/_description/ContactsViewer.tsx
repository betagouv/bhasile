"use client";

import { ReactElement, useState } from "react";

import { formatCityName } from "@/app/utils/adresse.util";
import { getCollectiveAddress } from "@/app/utils/collectiveAdress.util";
import { formatPhoneNumber } from "@/app/utils/phone.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ContactsViewer = (): ReactElement => {
  const [showContacts, setShowContacts] = useState(false);
  const { structure } = useStructureContext();

  const {
    nom,
    adresseAdministrative,
    codePostalAdministratif,
    communeAdministrative,
    contacts,
  } = structure || {};

  const collectiveAddress = getCollectiveAddress(structure);

  return (
    <>
      <div className="flex items-center">
        <strong className="fr-pr-2w">Adresse administrative</strong>
        <span className="fr-pr-1w">
          {nom ? `${nom}, ` : ""}
          {adresseAdministrative}, {codePostalAdministratif}{" "}
          {formatCityName(communeAdministrative ?? "")}
        </span>
        <button
          className={`fr-btn fr-btn--sm fr-btn--icon-left fr-btn--tertiary-no-outline py-0 ${
            showContacts ? "fr-icon-eye-off-line" : "fr-icon-eye-line"
          }`}
          onClick={() => setShowContacts(!showContacts)}
        >
          {showContacts ? "Masquer les contacts" : "Voir les contacts"}
        </button>
      </div>
      <div>
        {showContacts && (
          <div className="text-mention-grey">
            {contacts?.map((contact) => (
              <div key={contact.email} className="pb-1">
                <strong className="fr-pr-3w">
                  {contact.prenom} {contact.nom} ({contact.role})
                </strong>
                <span className="fr-pr-3w">{contact.email}</span>
                <span>{formatPhoneNumber(contact.telephone)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {collectiveAddress && (
        <>
          <hr />
          <div className="flex items-center">
            <strong className="pr-2">Adresse d&apos;hébergement</strong>
            {collectiveAddress.adresse}, {collectiveAddress.codePostal}{" "}
            {collectiveAddress.commune}
          </div>
        </>
      )}
    </>
  );
};
