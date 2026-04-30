export default async function TransformationSelectionsPage({
  params,
}: {
  params: Promise<{ idTransformation: string }>;
}) {
  const { idTransformation } = await params;

  return (
    <div>
      <h1>Transformation - Selections</h1>
      <p>idTransformation: {idTransformation}</p>
    </div>
  );
}
