"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

import { TransformationContextType } from "./TransformationContext";

type SaveCurrentFormFn = () => Promise<boolean>;

type TransformationContextInternalType = {
  transformation: TransformationApiRead | null;
  setTransformation: (t: TransformationApiRead | null) => void;
  registerSaver: (saver: SaveCurrentFormFn | null) => void;
  saveCurrentForm: SaveCurrentFormFn;
  isSaverRegistered: boolean;
  shouldShowIncompleteSteps: boolean;
  setShouldShowIncompleteSteps: (value: boolean) => void;
};

const TransformationContextInternal =
  createContext<TransformationContextInternalType>({
    transformation: null,
    setTransformation: () => {},
    registerSaver: () => {},
    saveCurrentForm: async () => false,
    isSaverRegistered: false,
    shouldShowIncompleteSteps: false,
    setShouldShowIncompleteSteps: () => {},
  });

export function TransformationClientProvider({
  children,
  transformation: initialTransformation,
}: {
  children: ReactNode;
  transformation: TransformationApiRead | null;
}) {
  const [transformation, setTransformation] = useState(initialTransformation);

  const [shouldShowIncompleteSteps, setShouldShowIncompleteSteps] =
    useState(false);

  const saverRef = useRef<SaveCurrentFormFn | null>(null);
  const [isSaverRegistered, setIsSaverRegistered] = useState(false);

  const registerSaver = useCallback((saver: SaveCurrentFormFn | null) => {
    saverRef.current = saver;
    setIsSaverRegistered(saver !== null);
  }, []);

  const saveCurrentForm = useCallback<SaveCurrentFormFn>(async () => {
    if (!saverRef.current) {
      throw new Error("Aucun formulaire enregistrable n'est monté");
    }
    return saverRef.current();
  }, []);

  return (
    <TransformationContextInternal.Provider
      value={{
        transformation,
        setTransformation,
        registerSaver,
        saveCurrentForm,
        isSaverRegistered,
        shouldShowIncompleteSteps,
        setShouldShowIncompleteSteps,
      }}
    >
      {children}
    </TransformationContextInternal.Provider>
  );
}

export function useOptionalTransformationContext(): {
  transformation: TransformationApiRead | null;
  setTransformation: (t: TransformationApiRead) => void;
  registerSaver: (saver: SaveCurrentFormFn | null) => void;
  saveCurrentForm: SaveCurrentFormFn;
  isSaverRegistered: boolean;
  shouldShowIncompleteSteps: boolean;
  setShouldShowIncompleteSteps: (value: boolean) => void;
} {
  const context = useContext(TransformationContextInternal);
  return {
    transformation: context.transformation,
    setTransformation: context.setTransformation as (
      t: TransformationApiRead
    ) => void,
    registerSaver: context.registerSaver,
    saveCurrentForm: context.saveCurrentForm,
    isSaverRegistered: context.isSaverRegistered,
    shouldShowIncompleteSteps: context.shouldShowIncompleteSteps,
    setShouldShowIncompleteSteps: context.setShouldShowIncompleteSteps,
  };
}

export function useTransformationContext(): TransformationContextType & {
  setTransformation: (t: TransformationApiRead) => void;
  registerSaver: (saver: SaveCurrentFormFn | null) => void;
  saveCurrentForm: SaveCurrentFormFn;
  isSaverRegistered: boolean;
  shouldShowIncompleteSteps: boolean;
  setShouldShowIncompleteSteps: (value: boolean) => void;
} {
  const context = useContext(TransformationContextInternal);

  if (context === undefined) {
    throw new Error(
      "useTransformationContext doit être utilisé à l'intérieur d'un TransformationProvider"
    );
  }

  if (context.transformation === null) {
    throw new Error("Transformation indisponible dans le contexte");
  }
  return {
    transformation: context.transformation,
    setTransformation: context.setTransformation,
    registerSaver: context.registerSaver,
    saveCurrentForm: context.saveCurrentForm,
    isSaverRegistered: context.isSaverRegistered,
    shouldShowIncompleteSteps: context.shouldShowIncompleteSteps,
    setShouldShowIncompleteSteps: context.setShouldShowIncompleteSteps,
  };
}
