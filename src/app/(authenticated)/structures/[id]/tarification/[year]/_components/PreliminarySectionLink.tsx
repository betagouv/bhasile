import Link from "next/link";
import { ReactElement, ReactNode } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";

export const PreliminarySectionLink = ({
  label,
  href,
  isSelected = false,
  isLate = false,
  isExternal = false,
}: Props): ReactElement => {
  const className = cn(
    "min-w-0 flex items-center gap-2 rounded pl-3 pr-4 py-1.5 text-xs bg-none!",
    isSelected
      ? "bg-active-blue-france! text-white!"
      : "bg-alt-blue-france! text-title-blue-france!"
  );
  const content: ReactNode = (
    <>
      <span aria-hidden className="fr-icon-file-text-fill fr-icon--sm" />
      {label}
    </>
  );

  return (
    <li className="p-0 flex items-center gap-2">
      {isExternal ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {content}
        </a>
      ) : (
        <Link
          href={href}
          aria-current={isSelected ? "page" : undefined}
          className={className}
        >
          {content}
        </Link>
      )}
      {isLate && (
        <Badge type="error" className="shrink-0">
          En retard
        </Badge>
      )}
    </li>
  );
};

type Props = {
  label: string;
  href: string;
  isSelected?: boolean;
  isLate?: boolean;
  isExternal?: boolean;
};
