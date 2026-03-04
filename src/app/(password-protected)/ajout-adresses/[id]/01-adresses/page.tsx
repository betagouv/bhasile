import { AdressesRecovery } from "./_components/AdressesRecovery";

export default async function AjoutAdressesPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h2>Adresses</h2>
      <AdressesRecovery id={id} />
    </div>
  );
}
