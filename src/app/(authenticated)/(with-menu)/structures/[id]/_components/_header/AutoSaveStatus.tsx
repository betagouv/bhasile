import Button from "@codegouvfr/react-dsfr/Button";
import Image from "next/image";

import { useFetchState } from "@/app/context/FetchStateContext";
import { FetchState } from "@/types/fetch-state.type";

export const AutoSaveStatus = ({ onStatusClick }: Props) => {
  const { getFetchState } = useFetchState();
  const saveState = getFetchState("structure-save");

  return (
    <Button
      onClick={saveState === FetchState.ERROR ? undefined : onStatusClick}
      className="fr-btn--tertiary-no-outline"
    >
      {saveState === FetchState.LOADING && (
        <span className="fr-icon-refresh-line text-mention-grey" />
      )}
      {saveState === FetchState.ERROR && (
        <span className="fr-icon-warning-line text-default-error" />
      )}
      {saveState === FetchState.IDLE && (
        <span className="text-mention-grey">
          <Image
            src="/autosave-picto.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="text-mention-grey"
          />
        </span>
      )}
    </Button>
  );
};

type Props = {
  onStatusClick: () => void;
};
