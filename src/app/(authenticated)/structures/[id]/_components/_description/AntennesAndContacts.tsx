import { ReactElement } from "react";

import { formatCityName } from "@/app/utils/adresse.util";
import { formatPhoneNumber } from "@/app/utils/phone.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const AntennesAndContacts = (): ReactElement => {
  const { structure } = useStructureContext();

  const { antennes, contacts } = structure;

  return (
    <>
      {antennes && antennes.length > 0 && (
        <>
          <h4 className="text-title-blue-france text-lg mb-3">
            Sites administratifs
          </h4>
          <table className="mb-8 whitespace-nowrap">
            <tbody>
              {antennes.map((antenne) => (
                <tr
                  key={antenne.id}
                  className="border-b border-default-grey last:border-b-0"
                >
                  <td className="py-3 pr-8 italic">{antenne.name}</td>
                  <td className="py-3 w-full">
                    {antenne.adresse} {antenne.codePostal}{" "}
                    {formatCityName(antenne.commune)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {contacts && contacts.length > 0 && (
        <>
          <h4 className="text-title-blue-france text-lg mb-3">Contacts</h4>
          <table className="whitespace-nowrap">
            <tbody>
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="border-b border-default-grey last:border-b-0"
                >
                  <td className="py-3 pr-8 italic">
                    {contact.prenom} {contact.nom}
                  </td>
                  <td className="py-3 pr-8">
                    {contact.role}{" "}
                    {contact.perimetre && `(${contact.perimetre})`}
                  </td>
                  <td className="py-3 pr-8">{contact.email}</td>
                  <td className="py-3 w-full">
                    {formatPhoneNumber(contact.telephone)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};
