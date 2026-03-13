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
        <table className="mb-8 whitespace-nowrap">
          <caption className="text-title-blue-france text-lg mb-3 text-left font-bold">
            Sites administratifs
          </caption>
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
      )}
      {contacts && contacts.length > 0 && (
        <table className="whitespace-nowrap">
          <caption className="text-title-blue-france text-lg mb-3 text-left font-bold">
            Contacts
          </caption>
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
                  {contact.role} {contact.perimetre && `(${contact.perimetre})`}
                </td>
                <td className="py-3 pr-8">{contact.email}</td>
                <td className="py-3 w-full">
                  {formatPhoneNumber(contact.telephone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};
