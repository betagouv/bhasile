import { Menu } from "@/app/components/Menu";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="w-full max-w-screen flex bg-white" id="content">
      <Menu />
      <div className="flex-1 bg-alt-grey">{children}</div>
    </main>
  );
}
