export default async function TransformationFermeturePage({
  params,
}: {
  params: Promise<{ idTransformation: string; idStructure: string }>;
}) {
  const { idTransformation, idStructure } = await params;

  return (
    <div>
      <h1>Transformation - Fermeture</h1>
      <p>idTransformation: {idTransformation}</p>
      <p>idStructure: {idStructure}</p>
    </div>
  );
}
