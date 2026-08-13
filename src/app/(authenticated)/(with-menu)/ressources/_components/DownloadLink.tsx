import { ReactElement } from "react";

import { formatBytes } from "@/app/utils/number.util";
import { Link } from "@/types/ressources.type";

const LINK_CLASSNAME =
  "border-b border-active-blue-france text-title-blue-france leading-relaxed";

export const DownloadLink = ({ link }: Props): ReactElement => {
  if (!link.file) {
    return (
      <div>
        <a
          href={link.href}
          target="_blank"
          rel="noopener external"
          title={`${link.label} - ouvre une nouvelle fenêtre`}
          className={LINK_CLASSNAME}
        >
          {link.label}
        </a>
        <div className="mt-1 text-mention-grey">Lien externe</div>
      </div>
    );
  }

  return (
    <div>
      <a href={link.href} download className={LINK_CLASSNAME}>
        {link.label}
        <span className="ml-2 fr-icon-download-line fr-icon--sm" />
      </a>
      <div className="mt-1 text-mention-grey">
        {[link.file.extension, formatBytes(link.file.bytes)]
          .filter(Boolean)
          .join(" – ")}
      </div>
    </div>
  );
};

type Props = {
  link: Link;
};
