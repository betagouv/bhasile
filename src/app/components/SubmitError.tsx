import { ReactElement } from "react";

import { getErrorEmail } from "@/app/utils/errorMail.util";

export const SubmitError = ({
  structureCodeBhasile,
  backendError,
}: Props): ReactElement => {
  return (
    <div className="flex items-end flex-col">
      <p className="text-default-error m-0 p-0">
        Une erreur s’est produite.{" "}
        <a
          href={getErrorEmail(backendError, structureCodeBhasile)}
          className="underline"
          target="_blank"
        >
          Nous prévenir
        </a>
      </p>
    </div>
  );
};

type Props = {
  structureCodeBhasile?: string;
  backendError?: string;
};
