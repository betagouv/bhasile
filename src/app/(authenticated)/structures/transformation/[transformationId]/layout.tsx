import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationProvider } from "./_context/TransformationContext";

async function getTransformation(id: string): Promise<TransformationApiRead> {
  try {
    const baseUrl = process.env.NEXT_URL || "";
    const result = await fetch(`${baseUrl}/api/transformations/${id}`, {
      cache: "no-store",
      // Requête côté serveur donc il faut appeler les headers manuellement
      headers: await headers(),
    });

    if (!result.ok) {
      throw new Error(
        `Impossible de récupérer la structure : ${result.status}`
      );
    }

    return await result.json();
  } catch (error) {
    console.error(error);
    notFound();
  }
}

export default async function TransformationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ transformationId: string }>;
}) {
  const { transformationId } = await params;
  const transformation = await getTransformation(transformationId);

  if (!transformation) {
    notFound();
  }

  return (
    <TransformationProvider transformation={transformation}>
      {children}
    </TransformationProvider>
  );
}
