import { PropsWithChildren } from "react";

import { ModificationGuard } from "./_components/ModificationGuard";

export default function ModificationLayout({ children }: PropsWithChildren) {
  return <ModificationGuard>{children}</ModificationGuard>;
}
