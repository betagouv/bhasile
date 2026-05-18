import { TransformationMenu } from "./_components/TransformationMenu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="w-full max-w-screen flex bg-white" id="content">
      <TransformationMenu />
      <div className="flex-1">{children}</div>
    </main>
  );
}
