import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement } from "react";

import { ValidationButtonWithHook } from "./ValidationButtonWithHook";

export const ValidationButton = ({
  selectedStructuresId,
}: Props): ReactElement => {
  return (
    <div className="flex justify-center">
      {selectedStructuresId.length > 0 ? (
        <ValidationButtonWithHook
          key={selectedStructuresId[0]}
          structuresId={selectedStructuresId[0]}
        />
      ) : (
        <Button
          type="button"
          onClick={() => ""}
          disabled={!selectedStructuresId.length}
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
  selectedStructuresId: number[];
};
