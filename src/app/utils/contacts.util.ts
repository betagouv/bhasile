import { ContactApiType } from "@/schemas/api/contact.schema";

export const transformAgentFormContactsToApiContacts = (
  contacts: (Partial<ContactApiType> | undefined)[] = []
): Partial<ContactApiType>[] => {
  if (contacts.length === 0) {
    return [];
  }
  return contacts
    .filter((contact): contact is ContactApiType => contact !== undefined)
    .filter(
      (contact) =>
        contact.prenom ||
        contact.nom ||
        contact.email ||
        contact.telephone ||
        contact.role
    );
};
