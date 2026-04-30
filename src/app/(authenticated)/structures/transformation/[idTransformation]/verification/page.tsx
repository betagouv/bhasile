export default async function TransformationVerificationPage({
  params,
}: {
  params: Promise<{ idTransformation: string }>;
}) {
  const { idTransformation } = await params;

  return (
    <div>
      <h1>Transformation - Verification</h1>
      <p>idTransformation: {idTransformation}</p>
    </div>
  );
}
