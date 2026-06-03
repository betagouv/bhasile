import { Contact } from "@/generated/prisma/client";

export const getContactsApiRead = (contacts: Contact[]) => {
  return contacts?.map((contact) => ({
    ...contact,
    prenom: contact.prenom || "",
    nom: contact.nom || "",
    telephone: contact.telephone || "",
    email: contact.email || "",
    role: contact.role || "",
    structureId: contact.structureId || undefined,
  }));
};
