import { OperateurDbDetail } from "../operateurs/operateur.db.type";

export const getContactsApiRead = (operateur: OperateurDbDetail) => {
  return operateur.contacts?.map((contact) => ({
    ...contact,
    prenom: contact.prenom || "",
    nom: contact.nom || "",
    telephone: contact.telephone || "",
    email: contact.email || "",
    role: contact.role || "",
    structureId: contact.structureId || undefined,
  }));
};
