import { getServerSession } from "next-auth";
import { ReactElement } from "react";

import { authOptions } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

import { DashboardHeader } from "./_components/DashboardHeader";

export default async function DashboardPage(): Promise<ReactElement> {
  const session = await getServerSession(authOptions);
  const prenom = (session?.user as SessionUser | undefined)?.prenom;

  return <DashboardHeader prenom={prenom} />;
}
