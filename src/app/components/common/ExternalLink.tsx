import Link from "next/link";
import { ReactElement } from "react";

export const ExternalLink = ({ title, url }: Props): ReactElement => {
  return (
    <Link
      title={`${title} - ouvre une nouvelle fenêtre`}
      href={url}
      target="_blank"
      rel="noopener external"
      className="after:w-[12]"
    >
      {title}
    </Link>
  );
};

type Props = {
  title: string;
  url: string;
};
