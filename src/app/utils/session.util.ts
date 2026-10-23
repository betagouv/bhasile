import { SessionUser } from "@/types/global";

export const isOperateurUser = (user: SessionUser): boolean => {
  return user?.operateurId !== null;
};
