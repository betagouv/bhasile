import { SessionPermissions, SessionUser } from "@/types/global";
import { ALL_READABLE, ReadableIds } from "@/types/readable-ids.type";

import { canAccessPage } from "./pages";
import { isAgent } from "./rules";

export const MIN_STRUCTURES_FOR_STATISTIQUES = 2;

export const canReadRmu = (user: SessionPermissions | undefined): boolean =>
  isAgent(user);

export const canReadStatistiques = (
  user: SessionUser | undefined,
  readableStructureIds: ReadableIds
): boolean =>
  canAccessPage(user, "/statistiques") &&
  (readableStructureIds === ALL_READABLE ||
    readableStructureIds.length >= MIN_STRUCTURES_FOR_STATISTIQUES);
