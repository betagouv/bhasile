import { notFound, redirect } from "next/navigation";

import { parseId } from "@/app/utils/string.util";
import { CURRENT_YEAR } from "@/constants";

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
  redirect(`/structures/${structureId}/tarification/${CURRENT_YEAR}`);
}
