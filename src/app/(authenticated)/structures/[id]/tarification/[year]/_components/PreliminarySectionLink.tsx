import Link from "next/link";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";

export const PreliminarySectionLink = ({
  label,
  href,
  isSelected,
  isLate,
}: Props): ReactElement => (
  <li className="p-0 flex items-center gap-2">
    <Link
      href={href}
      aria-current={isSelected ? "page" : undefined}
      className={cn(
        "inline-block rounded-lg px-4 py-2 text-sm font-medium",
        isSelected
          ? "bg-active-blue-france text-white!"
          : "bg-alt-blue-france text-title-blue-france"
      )}
    >
      {label}
    </Link>
    {isLate && <Badge type="error">En retard</Badge>}
  </li>
);

type Props = {
  label: string;
  href: string;
  isSelected: boolean;
  isLate: boolean;
};
