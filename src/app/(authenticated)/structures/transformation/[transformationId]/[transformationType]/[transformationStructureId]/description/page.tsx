export default async function TransformationDescriptionPage({
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
      <h1>Transformation - Description</h1>
      <p>transformationId: {transformationId}</p>
      <p>transformationType: {transformationType}</p>
      <p>transformationStructureId: {transformationStructureId}</p>
    </div>
  );
}
