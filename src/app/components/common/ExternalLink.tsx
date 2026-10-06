import Link from "next/link";
import { ReactElement } from "react";

export const ExternalLink = ({
  title,
  url,
  className = "after:w-[12]",
  icon,
}: Props): ReactElement => {
  return (
    <Link
      title={`${title} - ouvre une nouvelle fenêtre`}
      href={url}
      target="_blank"
      rel="noopener external"
      className={className}
    >
      {icon && (
        <span className={`${icon} fr-icon--sm mr-2`} aria-hidden="true" />
      )}
      {title}
    </Link>
  );
};

type Props = {
  title: string;
  url: string;
  className?: string;
  icon?: string;
};
