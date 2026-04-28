import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement } from "react";

import { ExternalLink } from "@/app/components/common/ExternalLink";

export const AccesRefuse = (): ReactElement => {
  const BHASILE_CONTACT_EMAIL =
    process.env.NEXT_PUBLIC_BHASILE_CONTACT_EMAIL || "";

  return (
    <div className="max-w-[600px] my-10">
      <Alert
        title="Accès refusé"
        description={
          <span>
            L’accès à Bhasile n’est pas autorisé pour le compte ProConnect
            associé à l’adresse que vous avez utilisée.{" "}
            <ExternalLink
              url={`mailto:${BHASILE_CONTACT_EMAIL}`}
              title="Contacter le support"
            />
          </span>
        }
        severity="error"
      />
    </div>
  );
};
