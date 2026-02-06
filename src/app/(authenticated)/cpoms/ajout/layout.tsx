import { CpomAjoutHeader } from "./_components/CpomAjoutHeader";

export default async function CpomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
      <CpomAjoutHeader />
      <div className="mx-4">{children}</div>;
    </div>
  );
}
