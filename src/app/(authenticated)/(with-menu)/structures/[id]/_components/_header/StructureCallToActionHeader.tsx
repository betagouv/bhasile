import Link from "next/link";
import { ReactElement, ReactNode } from "react";

export const StructureCallToActionHeader = ({
  message,
  label,
  href,
}: Props): ReactElement => (
  <div className="bg-alt-blue-france flex border-b border-b-border-default-grey px-6 py-4 items-center">
    <p className="m-0 pr-10 text-sm">{message}</p>
    <Link href={href} className="whitespace-nowrap h-full fr-btn">
      {label}
      <span className="pl-2 fr-icon-arrow-right-line fr-icon--sm" />
    </Link>
  </div>
);

type Props = {
  message: ReactNode;
  label: string;
  href: string;
};
