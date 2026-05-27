import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const ContactsBlock = (): ReactElement => {
  const router = useRouter();
  const { operateur } = useOperateurContext();

  return (
    <Block
      iconClass="fr-icon-group-line"
      title="Contacts nationaux et territoriaux"
      entityType="Operateur"
      entity={operateur}
      onEdit={() => {
        router.push(`/operateurs/${operateur.id}/modification/contacts`);
      }}
    >
      {operateur.contacts?.map((contact, index) => (
        <>
          <div className="flex gap-2 mb-3">
            <div className="w-full italic">
              {contact.prenom} {contact.nom}
            </div>
            <div className="w-full">
              {contact.role}
              {contact.perimetre && ` (${contact.perimetre})`}
            </div>
            <div className="w-full underline">{contact.email}</div>
            <div className="w-full">{contact.telephone}</div>
          </div>
          {index < operateur.contacts.length - 1 && (
            <hr className="col-span-2" />
          )}
        </>
      ))}
    </Block>
  );
};
