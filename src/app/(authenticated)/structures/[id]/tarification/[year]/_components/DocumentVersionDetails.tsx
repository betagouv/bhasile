import { ReactElement } from "react";

import { formatInstantDate } from "@/app/utils/date.util";
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
    {!version.isWithdrawn &&
      version.changesRequests.map(({ id, text, authorName }) => (
        <p key={id} className="mb-0 text-sm">
          Modifications demandées{authorName && ` par ${authorName}`} : {text}
        </p>
      ))}
  </div>
);

type Props = {
  version: SectionVersion;
  timeZone: string;
};
