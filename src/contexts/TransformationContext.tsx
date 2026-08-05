import { ReactNode } from "react";

import { TransformationClientProvider } from "@/contexts/TransformationClientContext";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";

export type TransformationContextType = {
  transformation: TransformationApiRead;
};

export function TransformationProvider({
  children,
  transformation,
}: {
  children: ReactNode;
  transformation: TransformationApiRead | null;
}) {
  return (
    <TransformationClientProvider transformation={transformation}>
      {children}
    </TransformationClientProvider>
  );
}
