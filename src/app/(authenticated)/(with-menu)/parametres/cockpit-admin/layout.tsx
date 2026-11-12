import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReactNode } from "react";

import { canAccessCockpitAdmin } from "@/lib/casl";
import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

export default async function CockpitAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!canAccessCockpitAdmin(session?.user as SessionUser | undefined)) {
    notFound();
  }

  return children;
}
