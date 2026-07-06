import { Prisma } from "@/generated/prisma/client";

export type OperateurDbDetail = Prisma.OperateurGetPayload<{
  include: {
    contacts: true;
    actesAdministratifs: {
      include: { fileUploads: true };
    };
  };
}>;

export const operateurListSelect = {
  id: true,
  name: true,
  parentId: true,
  logo: { select: { key: true } },
} satisfies Prisma.OperateurSelect;

export type OperateurListRow = Prisma.OperateurGetPayload<{
  select: typeof operateurListSelect;
}>;
