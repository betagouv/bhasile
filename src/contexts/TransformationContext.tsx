"use client";

import { createContext, ReactNode, useCallback, useContext, useState } from "react";

import { TransformationApiRead } from "@/schemas/api/transformation.schema";

const TransformationContext = createContext<
  TransformationContextValue | undefined
>(undefined);
TransformationContext.displayName = "TransformationContext";

export const TransformationProvider = ({
  children,
  transformation: initialTransformation,
}: Props) => {
  const [transformation, setTransformation] = useState(initialTransformation);
  const [shouldShowIncompleteSteps, setShouldShowIncompleteSteps] =
    useState(false);

  const [saveCurrentForm, setSaveCurrentForm] = useState<SaveCurrentFormFn>();

  const registerSaver = useCallback((saver: SaveCurrentFormFn | null) => {
    // setState prend une fonction pour un updater : l'envelopper la stocke telle quelle.
    setSaveCurrentForm(() => saver ?? undefined);
  }, []);

  return (
    <TransformationContext
      value={{
        transformation,
        setTransformation,
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

// Les composants du parcours transformation sont aussi montés sur
// /structures/transformation/type, où aucune transformation n'existe encore et donc
// aucun provider n'est monté. Ce hook renvoie alors un objet vide : tout est absent
// ensemble, jamais un champ isolé.
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
  setTransformation: (transformation: TransformationApiRead) => void;
  registerSaver: (saver: SaveCurrentFormFn | null) => void;
  // Absent tant qu'aucun formulaire n'a appelé registerSaver : sa présence vaut
  // « un formulaire enregistrable est monté ».
  saveCurrentForm: SaveCurrentFormFn | undefined;
  shouldShowIncompleteSteps: boolean;
  setShouldShowIncompleteSteps: (shouldShow: boolean) => void;
};

type Props = {
  children: ReactNode;
  transformation: TransformationApiRead;
};
