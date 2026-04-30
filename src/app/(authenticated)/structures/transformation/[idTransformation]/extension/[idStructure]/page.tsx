export default async function TransformationExtensionPage({
  params,
}: {
  params: Promise<{ idTransformation: string; idStructure: string }>;
}) {
  const { idTransformation, idStructure } = await params;

  return (
    <div>
      <h1>Transformation - Extension</h1>
      <p>idTransformation: {idTransformation}</p>
      <p>idStructure: {idStructure}</p>
    </div>
  );
}
