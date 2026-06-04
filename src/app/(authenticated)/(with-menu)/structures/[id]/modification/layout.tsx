import { ReactNode } from "react";

import { ModificationGuard } from "./_components/ModificationGuard";

export default function ModificationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ModificationGuard>{children}</ModificationGuard>;
}
