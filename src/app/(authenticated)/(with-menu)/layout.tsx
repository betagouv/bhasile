import { getReadableCpomIds } from "@/app/api/cpoms/cpom.service";
import { getReadableStructureIds } from "@/app/api/structures/structure.service";
import { Menu } from "@/app/components/Menu";
import { auth } from "@/lib/next-auth/auth";
import { SessionUser } from "@/types/global";
import { ReadableEntities } from "@/types/readable-ids.type";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const readableEntities = user ? await getReadableEntities(user) : undefined;

  return (
    <main className="w-full max-w-screen flex bg-white" id="content">
      <Menu readableEntities={readableEntities} />
      <div className="flex-1 bg-alt-grey">{children}</div>
    </main>
  );
}

const getReadableEntities = async (
  user: SessionUser
): Promise<ReadableEntities> => {
  const [structureIds, cpomIds] = await Promise.all([
    getReadableStructureIds(user),
    getReadableCpomIds(user),
  ]);
  return { structureIds, cpomIds };
};
