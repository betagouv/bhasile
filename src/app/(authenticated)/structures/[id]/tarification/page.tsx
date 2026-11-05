import { notFound, redirect } from "next/navigation";

import { getCurrentYear } from "@/app/utils/now.util";
import { parseId } from "@/app/utils/string.util";

export default async function CurrentTarificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const structureId = parseId(id);
  if (structureId === null) {
    notFound();
  }
  redirect(`/structures/${structureId}/tarification/${getCurrentYear()}`);
}
