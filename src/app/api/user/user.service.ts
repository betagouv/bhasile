import { Role } from "@/generated/prisma/client";

import { getEmailPatterns } from "../email-patterns/email-pattern.repository";
import { upsertUser } from "./user.repository";

export const createOrUpdateUser = async ({
  prenom,
  nom,
  email,
  role,
}: CreateOrUpdateUserArgs): Promise<void> => {
  const emailPatterns = await getEmailPatterns();
  const emailPattern = emailPatterns.find(({ pattern }) => {
    if (!pattern) {
      return;
    }
    const regex = new RegExp(pattern, "i");
    if (regex.test(email)) {
      return role;
    }
    return;
  });
  if (emailPattern) {
    await upsertUser({
      prenom,
      nom,
      email,
      role,
      emailPattern: emailPattern.pattern,
    });
  } else {
    await upsertUser({ prenom, nom, email, role });
  }
};

type CreateOrUpdateUserArgs = {
  prenom: string;
  nom: string;
  email: string;
  role: Role;
};
