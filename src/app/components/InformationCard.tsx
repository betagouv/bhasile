"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, ReactNode, useState } from "react";

import { NumberDisplay } from "./common/NumberDisplay";

export const InformationCard = ({
  primaryInformation,
  secondaryInformation,
  tertiaryInformation,
}: Props): ReactElement => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative px-6 py-3 rounded-xl bg-alt-blue-france flex-col min-w-[220px] max-w-[240px] h-full flex justify-center items-center">
      {tertiaryInformation && (
        <div className="absolute top-1 right-1">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            iconId={
              showDetails ? "fr-icon-close-line" : "fr-icon-question-line"
            }
            priority="tertiary no outline"
            title="Afficher/cacher les détails"
            size="small"
          />
        </div>
      )}
      {!showDetails && (
        <>
          <div className="text-2xl font-bold mb-0">
            {typeof primaryInformation === "number" ? (
              <NumberDisplay value={primaryInformation} />
            ) : (
              primaryInformation
            )}
          </div>
          <div className="text-center">{secondaryInformation}</div>
        </>
      )}
      {showDetails && (
        <div className="text-center text-sm">{tertiaryInformation}</div>
      )}
    </div>
  );
};

type Props = {
  primaryInformation: ReactNode;
  secondaryInformation: ReactNode;
  tertiaryInformation?: string;
};
