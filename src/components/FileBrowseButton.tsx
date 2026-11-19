import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, Ref } from "react";

import Loader from "@/app/components/ui/Loader";

export const FileBrowseButton = ({
  ref,
  onClick,
  isLoading,
  accessibleLabel,
  describedBy,
}: Props): ReactElement => (
  <Button
    ref={ref}
    type="button"
    size="small"
    priority="tertiary no outline"
    className="bg-white rounded"
    onClick={onClick}
    disabled={isLoading}
    aria-describedby={describedBy}
  >
    {isLoading ? <Loader /> : "Parcourir"}
    <span className="fr-sr-only"> – {accessibleLabel}</span>
  </Button>
);

type Props = {
  ref?: Ref<HTMLButtonElement>;
  onClick: () => void;
  isLoading: boolean;
  accessibleLabel: string;
  describedBy: string;
};
