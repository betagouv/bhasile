import { notFound } from "next/navigation";

import { getReadableStructureIds } from "@/app/api/structures/structure.service";
import { canReadStatistiques } from "@/lib/casl";
import { auth } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";

export default async function StatistiquesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (
    !user ||
    !canReadStatistiques(user, await getReadableStructureIds(user))
  ) {
    notFound();
  }

  return children;
}
