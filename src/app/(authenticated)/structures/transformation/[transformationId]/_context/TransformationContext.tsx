import { ReactNode } from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationClientProvider } from "./TransformationClientContext";

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
