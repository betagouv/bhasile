export default async function TransformationActesAdministratifsPage({
  params,
}: {
  params: Promise<{
    transformationId: string;
    transformationType: string;
    transformationStructureId: string;
  }>;
}) {
  const { transformationId, transformationType, transformationStructureId } =
    await params;

  return (
    <div>
      <h1>Transformation - Actes administratifs</h1>
      <p>transformationId: {transformationId}</p>
      <p>transformationType: {transformationType}</p>
      <p>transformationStructureId: {transformationStructureId}</p>
    </div>
  );
}
