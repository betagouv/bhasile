"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

const TransformationContext = createContext<
  TransformationContextValue | undefined
>(undefined);
TransformationContext.displayName = "TransformationContext";

export const TransformationProvider = ({ children, transformation }: Props) => {
  const [shouldShowIncompleteSteps, setShouldShowIncompleteSteps] =
    useState(false);

  const [saveCurrentForm, setSaveCurrentForm] = useState<SaveCurrentFormFn>();

  const registerSaver = useCallback((saver: SaveCurrentFormFn | null) => {
    // La forme updater est obligatoire : passer directement `saver` ferait
    // exécuter la fonction par React au lieu de la stocker.
    setSaveCurrentForm(() => saver ?? undefined);
  }, []);

  return (
    <TransformationContext
      value={{
        transformation,
        registerSaver,
        saveCurrentForm,
        shouldShowIncompleteSteps,
        setShouldShowIncompleteSteps,
      }}
    >
      {children}
    </TransformationContext>
  );
};

export const useOptionalTransformationContext =
  (): Partial<TransformationContextValue> =>
    useContext(TransformationContext) ?? {};

export const useTransformationContext = (): TransformationContextValue => {
  const context = useContext(TransformationContext);

  if (!context) {
    throw new Error(
      "useTransformationContext doit être utilisé à l'intérieur d'un TransformationProvider"
    );
  }

  return context;
};

type SaveCurrentFormFn = () => Promise<boolean>;

type TransformationContextValue = {
  transformation: TransformationApiRead;
  registerSaver: (saver: SaveCurrentFormFn | null) => void;
  saveCurrentForm: SaveCurrentFormFn | undefined;
  shouldShowIncompleteSteps: boolean;
  setShouldShowIncompleteSteps: (shouldShow: boolean) => void;
};

type Props = {
  children: ReactNode;
  transformation: TransformationApiRead;
};
