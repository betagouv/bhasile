import prisma from "@/lib/prisma";
import { ContactApiType } from "@/schemas/api/contact.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { FINALISATION_FORM_SLUG } from "../forms/form.constants";
import {
  resolvableVersionSelect,
  transformationStatusSelect,
} from "../structure-versions/structure-version.db.type";

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

  let where: { structureVersionId: number } | { operateurId: number };
  if (entityId.structureVersionId !== undefined) {
    where = { structureVersionId: entityId.structureVersionId };
  } else if (entityId.operateurId !== undefined) {
    where = { operateurId: entityId.operateurId };
  } else {
    throw new Error("ID d'entité invalide");
  }

  await tx.contact.deleteMany({ where });

  if (contacts.length === 0) {
    return;
  }

  await tx.contact.createMany({
    data: contacts.map((contact) => ({
      ...where,
      prenom: contact.prenom ?? "",
      nom: contact.nom ?? "",
      telephone: contact.telephone ?? "",
      email: contact.email ?? "",
      role: contact.role ?? "",
      perimetre: contact.perimetre ?? "",
    })),
  });
};

export const findStructuresWithContactEmail = (email: string) =>
  prisma.structure.findMany({
    where: {
      structureVersions: { some: { contacts: { some: { email } } } },
    },
    select: {
      id: true,
      forms: {
        where: { formDefinition: { slug: FINALISATION_FORM_SLUG } },
        select: { status: true, formDefinition: { select: { slug: true } } },
      },
      structureVersions: {
        select: {
          ...resolvableVersionSelect,
          structureVersionTransformation: {
            select: { type: true, ...transformationStatusSelect },
          },
          contacts: { where: { email }, select: { id: true } },
        },
      },
    },
  });
