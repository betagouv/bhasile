import { UserActionCategory } from "@/generated/prisma/enums";

export const getActionFromMethod = (method: string): UserActionCategory => {
  const methods: Record<string, UserActionCategory> = {
    GET: UserActionCategory.READ,
    POST: UserActionCategory.CREATE,
    PUT: UserActionCategory.UPDATE,
    DELETE: UserActionCategory.DELETE,
  };
  return methods[method];
};
