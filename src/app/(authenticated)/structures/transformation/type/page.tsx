export default async function TransformationSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: "huda" | "creation" | "base" }>;
}) {
  const { type } = await searchParams;

  return (
    <div>
      <h1>Transformation - Selection</h1>
      <p>type: {type ?? "non fourni"}</p>
    </div>
  );
}
