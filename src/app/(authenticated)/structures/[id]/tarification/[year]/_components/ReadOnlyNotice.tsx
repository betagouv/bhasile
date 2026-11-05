import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement } from "react";

export const ReadOnlyNotice = ({ year }: Props): ReactElement => (
  <Alert
    severity="info"
    small
    description={`La campagne ${year} est close : ses échanges sont en lecture seule.`}
  />
);

type Props = {
  year: number;
};
