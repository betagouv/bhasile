import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import { formatInstantDate } from "@/lib/tarification/tarification.date";
import type { SectionVersion } from "@/lib/tarification/tarification.section";

export const DocumentVersions = ({
  versions,
  selectedVersionId,
  timeZone,
  onSelect,
}: Props): ReactElement => (
  <ul className="fr-raw-list p-0 m-0 flex flex-col gap-1">
    {versions.map((version) => (
      <li key={version.id} className="p-0">
        <button
          type="button"
          aria-current={version.id === selectedVersionId ? "true" : undefined}
          onClick={() => onSelect(version.id)}
          className={cn(
            "w-full text-left text-sm rounded px-2 py-1",
            version.id === selectedVersionId && "bg-alt-blue-france"
          )}
        >
          <span className="font-medium">{version.stateLabel}</span>
          {version.date && ` – ${formatInstantDate(version.date, timeZone)}`}
          {version.authorName && ` – ${version.authorName}`}
          <span className="block text-xs text-mention-grey">
            {version.file.originalName}
          </span>
        </button>
      </li>
    ))}
  </ul>
);

type Props = {
  versions: SectionVersion[];
  selectedVersionId: number;
  timeZone: string;
  onSelect: (versionId: number) => void;
};
