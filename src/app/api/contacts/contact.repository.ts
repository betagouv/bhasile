import { ContactApiType } from "@/schemas/api/contact.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

// WARNING: attenion, auparavant on avait un type de contact,
// donc on avait une unicité structureDnaCode x type.
// Cette unicité n'existe plus donc on supprime et recrée tout : voir si effets de bord !

export const createOrUpdateContacts = async (
  tx: PrismaTransaction,
  contacts: Partial<ContactApiType>[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!contacts) {
    return;
  }

  await tx.contact.deleteMany({
    where: entityId,
  });

  if (contacts.length === 0) {
    return;
  }

  await tx.contact.createMany({
    data: contacts.map((contact) => ({
      ...entityId,
      prenom: contact.prenom ?? "",
      nom: contact.nom ?? "",
      telephone: contact.telephone ?? "",
      email: contact.email ?? "",
      role: contact.role ?? "",
      perimetre: contact.perimetre ?? "",
    })),
  });
};
