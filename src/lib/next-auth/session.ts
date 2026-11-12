import { getServerSession } from "next-auth";

import { SessionUser } from "@/types/global";

import { authOptions } from "./auth";

export const getSessionUser = async (): Promise<SessionUser | undefined> =>
  (await getServerSession(authOptions))?.user as SessionUser | undefined;
