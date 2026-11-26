import * as Sentry from "@sentry/nextjs";

import { getReadableCpomIdsSample } from "@/app/api/cpoms/cpom.service";
import { getReadableStructureIdsSample } from "@/app/api/structures/structure.service";
import { Menu } from "@/app/components/Menu";
import { auth } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";
import { ReadableEntitiesSample } from "@/types/readable-ids.type";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const readableEntities = user
    ? await getReadableEntitiesSampleOrUndefined(user)
    : undefined;

  return (
    <main className="w-full max-w-screen flex bg-white" id="content">
      <Menu readableEntities={readableEntities} />
      <div className="flex-1 bg-alt-grey">{children}</div>
    </main>
  );
}

const getReadableEntitiesSampleOrUndefined = async (
  user: SessionUser
): Promise<ReadableEntitiesSample | undefined> => {
  try {
    const [structureIds, cpomIds] = await Promise.all([
      getReadableStructureIdsSample(user),
      getReadableCpomIdsSample(user),
    ]);
    return { structureIds, cpomIds };
  } catch (error) {
    Sentry.captureException(error);
    return undefined;
  }
};
