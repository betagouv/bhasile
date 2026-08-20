"use client";

import { usePersistSearchQuery } from "@/app/hooks/usePersistSearchQuery";

export const QueryPersister = ({ targetPath, storageKey }: Props): null => {
  usePersistSearchQuery(targetPath, storageKey);
  return null;
};

type Props = {
  targetPath: string;
  storageKey: string;
};
