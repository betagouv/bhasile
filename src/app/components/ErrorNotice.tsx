import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement } from "react";

import { getErrorEmail } from "@/app/utils/errorMail.util";

import { ErrorDisclosure } from "./ErrorDisclosure";

export const ErrorNotice = ({
  message,
}: {
  message?: string;
}): ReactElement => (
  <Alert
    severity="error"
    small
    description={
      <>
        Une erreur s’est produite.{" "}
        <a
          href={getErrorEmail(message)}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nous prévenir
        </a>
        .{message && <ErrorDisclosure message={message} />}
      </>
    }
  />
);
