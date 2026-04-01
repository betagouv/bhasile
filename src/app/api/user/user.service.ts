import { Role } from "@/generated/prisma/client";

import { getEmailPatterns } from "../email-patterns/email-pattern.repository";
import { upsertUser } from "./user.repository";

export const createOrUpdateUser = async ({
  name,
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
      name,
      email,
      role,
      emailPattern: emailPattern.pattern,
    });
  } else {
    await upsertUser({ name, email, role });
  }
};

type CreateOrUpdateUserArgs = {
  name: string;
  email: string;
  role: Role;
};
