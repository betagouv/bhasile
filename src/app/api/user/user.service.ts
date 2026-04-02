import { getEmailPatterns } from "../email-patterns/email-pattern.repository";
import { upsertUser } from "./user.repository";

export const createOrUpdateUser = async ({
  name,
  email,
}: CreateOrUpdateUserArgs): Promise<void> => {
  const emailPatterns = await getEmailPatterns();
  const emailPattern = emailPatterns.find(({ pattern }) => {
    if (!pattern) {
      return false;
    }
    const regex = new RegExp(pattern, "i");
    return regex.test(email);
  });
  await upsertUser({
    name,
    email,
    emailPattern: emailPattern?.pattern ?? undefined,
  });
};

type CreateOrUpdateUserArgs = {
  name: string;
  email: string;
};
