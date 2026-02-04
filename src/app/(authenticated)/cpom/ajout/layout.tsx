import { CpomHeader } from "./_components/CpomHeader";

export default async function CpomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
      <CpomHeader />
      <div className="mx-4">{children}</div>;
    </div>
  );
}
