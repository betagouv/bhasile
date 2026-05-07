export default async function TransformationPlacesEtHebergementPage({
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
      <h1>Transformation - Places et hébergement</h1>
      <p>transformationId: {transformationId}</p>
      <p>transformationType: {transformationType}</p>
      <p>transformationStructureId: {transformationStructureId}</p>
    </div>
  );
}
