import { ReactElement } from "react";

export const ErrorDisclosure = ({
  message,
}: {
  message: string;
}): ReactElement => (
  <details className="mt-1">
    <summary className="cursor-pointer text-sm underline">Voir l’erreur</summary>
    <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm">
      {message}
    </div>
  </details>
);
