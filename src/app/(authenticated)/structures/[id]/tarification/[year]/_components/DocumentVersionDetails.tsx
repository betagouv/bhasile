import { ReactElement } from "react";

import { formatInstantDate } from "@/lib/tarification/tarification.date";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

export const DocumentVersionDetails = ({
  version,
  timeZone,
}: Props): ReactElement => (
  <div className="flex flex-col gap-1">
    <h2 className="fr-h6 text-title-blue-france mb-0">{version.typesLabel}</h2>
    <p className="mb-0 font-medium">{version.stateLabel}</p>
    {version.date && (
      <p className="mb-0 text-sm text-mention-grey">
        le {formatInstantDate(version.date, timeZone)}
        {version.authorName && ` par ${version.authorName}`}
      </p>
    )}
    {version.isWithdrawn && version.withdrawalReason && (
      <p className="mb-0 text-sm">
        Motif du retrait : {version.withdrawalReason}
      </p>
    )}
    {!version.isWithdrawn && version.reviewRequestText && (
      <p className="mb-0 text-sm">
        Modifications demandées : {version.reviewRequestText}
      </p>
    )}
  </div>
);

type Props = {
  version: SectionVersion;
  timeZone: string;
};
