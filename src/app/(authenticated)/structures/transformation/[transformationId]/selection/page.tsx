export default async function TransformationSelectionsPage({
  params,
}: {
  params: Promise<{ transformationId: string }>;
}) {
  const { transformationId } = await params;

  return (
    <div>
      <h1>Transformation - Selections</h1>
      <p>transformationId: {transformationId}</p>
    </div>
  );
}
