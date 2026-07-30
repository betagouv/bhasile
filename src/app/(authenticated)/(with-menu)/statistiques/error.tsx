"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import * as Sentry from "@sentry/nextjs";
import { ReactElement, useEffect } from "react";

export default function StatistiquesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full py-16 text-center">
      <span
        className="fr-icon-warning-line text-default-error"
        aria-hidden="true"
      />
      <p className="text-lg font-bold text-title-blue-france mb-0">
        Impossible de charger les statistiques.
      </p>
      <p className="text-sm text-mention-grey mb-0">
        Une erreur est survenue lors de la récupération des données.
      </p>
      <Button priority="secondary" onClick={reset}>
        Réessayer
      </Button>
    </div>
  );
}
