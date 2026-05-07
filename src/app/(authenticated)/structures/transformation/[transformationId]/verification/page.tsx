export default async function TransformationVerificationPage({
  params,
}: {
  params: Promise<{ transformationId: string }>;
}) {
  const { transformationId } = await params;

  return (
    <div>
      <h1>Transformation - Verification</h1>
      <p>transformationId: {transformationId}</p>
    </div>
  );
}
