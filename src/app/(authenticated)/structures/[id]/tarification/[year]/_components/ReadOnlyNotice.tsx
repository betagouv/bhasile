import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement } from "react";

export const ReadOnlyNotice = ({
  year,
  isCampaignOpen,
}: Props): ReactElement => (
  <Alert
    severity="info"
    small
    description={
      isCampaignOpen
        ? "Lecture seule : les superadmins consultent les échanges sans y écrire."
        : `La campagne ${year} est close : ses échanges sont en lecture seule.`
    }
  />
);

type Props = {
  year: number;
  isCampaignOpen: boolean;
};
