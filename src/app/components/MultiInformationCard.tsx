"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { Fragment, ReactElement, ReactNode, useState } from "react";

import { cn } from "@/app/utils/classname.util";

export const MultiInformationCard = ({
  informations,
  detailLabel,
}: Props): ReactElement => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="px-6 py-3 rounded-xl bg-alt-blue-france flex-col h-full flex justify-center items-center relative">
      {detailLabel && (
        <div className="flex justify-end w-full absolute top-1 right-1 z-10">
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
      <div
        className={cn(
          "flex flex-col justify-center items-center w-full",
          showDetails && "invisible"
        )}
      >
        {informations.map(
          ({ primaryInformation, secondaryInformation }, index) => (
            <Fragment key={index}>
              <div
                className={`font-bold mb-0 ${index === 0 ? "text-2xl" : "text-xl"}`}
              >
                {primaryInformation}
              </div>
              <div className={`text-center ${index === 0 ? "text-lg" : ""}`}>
                {secondaryInformation}
              </div>
              {index !== informations.length - 1 && (
                <hr className="w-full pb-4! mt-4" />
              )}
            </Fragment>
          )
        )}
      </div>
      {showDetails && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm break-words overflow-y-auto">
          {detailLabel}
        </div>
      )}
    </div>
  );
};

type Props = {
  informations: Information[];
  detailLabel?: string;
};

type Information = {
  primaryInformation: ReactNode;
  secondaryInformation: string;
};
