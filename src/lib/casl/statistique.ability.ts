import { SessionPermissions } from "@/types/global";

import { isAgent } from "./rules";

export const canReadRmu = (user: SessionPermissions | undefined): boolean =>
  isAgent(user);
