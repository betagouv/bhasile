"use client";

import { usePersistSearchQuery } from "@/app/hooks/usePersistSearchQuery";
import { OPERATEURS_STORAGE_KEY } from "@/constants";

export const OperateursQueryPersister = (): null => {
  usePersistSearchQuery("/operateurs", OPERATEURS_STORAGE_KEY);
  return null;
};
