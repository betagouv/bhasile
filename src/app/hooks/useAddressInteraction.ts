import { useEffect, useState } from "react";

export function useAddressInteraction(fieldValue: string | undefined) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualError, setManualError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isFocused && hasInteracted && !hasSelected && fieldValue) {
      setManualError("Veuillez sélectionner une adresse dans la liste déroulante");
    } else if (!fieldValue || hasSelected) {
      setManualError(undefined);
    }
  }, [isFocused, hasInteracted, hasSelected, fieldValue]);

  return {
    hasInteracted,
    setHasInteracted,
    hasSelected,
    setHasSelected,
    isFocused,
    setIsFocused,
    manualError,
    setManualError,
  };
}
