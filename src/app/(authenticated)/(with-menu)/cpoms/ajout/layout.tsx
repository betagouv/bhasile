import { CpomAjoutHeader } from "./_components/CpomAjoutHeader";

export default async function CpomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
      <CpomAjoutHeader />
      <div className="max-w-6xl mx-auto px-3">{children}</div>;
    </div>
  );
}
