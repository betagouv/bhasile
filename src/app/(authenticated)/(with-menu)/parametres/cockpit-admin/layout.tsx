import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { canAccessCockpitAdmin } from "@/lib/casl";
import { getSessionUser } from "@/lib/next-auth/session";

export default async function CockpitAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!canAccessCockpitAdmin(await getSessionUser())) {
    notFound();
  }

  return children;
}
