"use client";

import { usePersistSearchQuery } from "@/app/hooks/usePersistSearchQuery";

export const OPERATEURS_STORAGE_KEY = "operateurs-query";

export const OperateursQueryPersister = () => {
  usePersistSearchQuery("/operateurs", OPERATEURS_STORAGE_KEY);
  return null;
};
