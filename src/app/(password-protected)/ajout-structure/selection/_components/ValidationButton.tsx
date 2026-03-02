import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";
import { useFormContext } from "react-hook-form";

import { ValidationButtonWithHook } from "./ValidationButtonWithHook";

export const ValidationButton = (): ReactElement => {
  const parentFormContext = useFormContext();
  const { watch } = parentFormContext;

  const structure = watch("structure");

  return (
    <div className="flex justify-center">
      {structure ? (
        <ValidationButtonWithHook key={structure.id} />
      ) : (
        <Button
          type="button"
          onClick={() => ""}
          disabled={!structure}
          className="flex gap-2"
        >
          J’ai trouvé ma structure{" "}
          <span className="fr-icon-arrow-right-line fr-icon--md" />
        </Button>
      )}
    </div>
  );
};
