import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { ValidationButtonWithHook } from "./ValidationButtonWithHook";

export const ValidationButton = ({
  selectedStructureIds,
}: Props): ReactElement => {
  return (
    <div className="flex justify-center">
      {selectedStructureIds.length > 0 ? (
        <ValidationButtonWithHook
          key={selectedStructureIds[0]}
          structuresId={selectedStructureIds[0]}
        />
      ) : (
        <Button
          type="button"
          disabled={!selectedStructureIds.length}
          className="flex gap-2"
        >
          J’ai trouvé ma structure{" "}
          <span className="fr-icon-arrow-right-line fr-icon--md" />
        </Button>
      )}
    </div>
  );
};

type Props = {
  selectedStructureIds: number[];
};
