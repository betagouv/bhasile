"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationContextType } from "./TransformationContext";

type TransformationContextInternalType = {
  transformation: TransformationApiRead | null;
  setTransformation: (t: TransformationApiRead | null) => void;
};

const TransformationContextInternal =
  createContext<TransformationContextInternalType>({
    transformation: null,
    setTransformation: () => {},
  });

export function TransformationClientProvider({
  children,
  transformation: initialTransformation,
}: {
  children: ReactNode;
  transformation: TransformationApiRead | null;
}) {
  const [transformation, setTransformation] = useState(initialTransformation);

  return (
    <TransformationContextInternal.Provider
      value={{ transformation, setTransformation }}
    >
      {children}
    </TransformationContextInternal.Provider>
  );
}

export function useTransformationContext(): TransformationContextType & {
  setTransformation: (t: TransformationApiRead) => void;
} {
  const context = useContext(TransformationContextInternal);

  if (context === undefined) {
    throw new Error(
      "useTransformationContext must be used within a TransformationProvider"
    );
  }

  if (context.transformation === null) {
    throw new Error("Transformation is not available");
  }
  return {
    transformation: context.transformation,
    setTransformation: context.setTransformation,
  };
}
