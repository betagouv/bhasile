import Alert from "@codegouvfr/react-dsfr/Alert";
import Link from "next/link";
import { ReactElement } from "react";

import { ExternalLink } from "@/app/components/common/ExternalLink";
import { BHASILE_CONTACT_EMAIL } from "@/constants";

export default function AccesEnAttente(): ReactElement {
  return (
    <div className="max-w-[600px] my-10 flex flex-col gap-6">
      <Alert
        title="Accès en attente de validation"
        description={
          <span>
            Votre compte ProConnect est bien reconnu, mais aucun droit ne vous a
            encore été attribué sur Bhasile. Veuillez contacter votre
            administrateur·ice pour activer votre accès.{" "}
            <ExternalLink
              url={`mailto:${BHASILE_CONTACT_EMAIL}`}
              title="Contacter le support"
            />
          </span>
        }
        severity="info"
      />
      <Link href="/deconnexion" className="fr-link">
        Se déconnecter
      </Link>
    </div>
  );
}
