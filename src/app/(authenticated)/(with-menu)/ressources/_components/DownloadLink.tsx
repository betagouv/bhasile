import { ReactElement } from "react";

import { formatBytes } from "@/app/utils/number.util";
import { Link } from "@/types/ressources.type";

export const DownloadLink = ({ link }: Props): ReactElement => {
  if (!link.file) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener external"
        title={`${link.label} - ouvre une nouvelle fenêtre`}
        className="underline text-title-blue-france"
      >
        {link.label}
        <span className="pl-2 fr-icon-external-link-line fr-icon--sm" />
      </a>
    );
  }

  return (
    <div>
      <a href={link.href} download className="underline text-title-blue-france">
        {link.label}
        <span className="pl-2 fr-icon-download-line fr-icon--sm" />
      </a>
      <div className="text-mention-grey">
        {link.file.extension} – {formatBytes(link.file.bytes)}
      </div>
    </div>
  );
};

type Props = {
  link: Link;
};
