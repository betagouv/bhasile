import { PropsWithChildren } from "react";

import { ModificationGuard } from "../_components/ModificationGuard";

export default function FinalisationLayout({ children }: PropsWithChildren) {
  return <ModificationGuard>{children}</ModificationGuard>;
}
