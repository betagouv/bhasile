"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PropsWithChildren, ReactNode, useEffect } from "react";

import { useStructureContext } from "@/app/(authenticated)/(with-menu)/structures/[id]/_context/StructureClientContext";
import { useCanUpdateStructure } from "@/app/hooks/useCanUpdateStructure";

export const ModificationGuard = ({
  children,
}: PropsWithChildren): ReactNode => {
  const router = useRouter();
  const { status } = useSession();
  const { structure } = useStructureContext();
  const canEdit = useCanUpdateStructure(structure);

  useEffect(() => {
    if (status !== "loading" && !canEdit) {
      router.replace(`/structures/${structure.id}`);
    }
  }, [status, canEdit, router, structure.id]);

  if (status === "loading" || !canEdit) {
    return null;
  }

  return children;
};
