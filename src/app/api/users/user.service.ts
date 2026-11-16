import { upsertUser } from "./user.repository";
import { normalizeEmail } from "./user.util";

export const createOrUpdateUser = async ({
  name,
  email,
}: CreateOrUpdateUserArgs): Promise<string | null> => {
  return upsertUser({ name, email: normalizeEmail(email) });
};

type CreateOrUpdateUserArgs = {
  name: string;
  email: string;
};
