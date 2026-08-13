import { notFound } from "next/navigation";

import { getTransformation } from "@/app/api/transformations/transformation.service";
import { TransformationProvider } from "@/contexts/TransformationContext";

import { TransformationHeader } from "../_components/TransformationHeader";
import { TransformationMenu } from "../_components/TransformationMenu";

export default async function TransformationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ transformationId: string }>;
}) {
  const { transformationId } = await params;
  const id = Number(transformationId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const transformation = await getTransformation(id);

  if (!transformation) {
    notFound();
  }

  return (
    <TransformationProvider transformation={transformation}>
      <main className="w-full max-w-screen flex" id="content">
        <TransformationMenu />
        <div className="flex-1 bg-alt-grey">
          <TransformationHeader />
          <div className="relative max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </TransformationProvider>
  );
}
