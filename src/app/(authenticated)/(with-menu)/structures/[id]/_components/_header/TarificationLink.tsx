import Link from "next/link";
import { ReactElement } from "react";

export const TarificationLink = ({ structureId }: Props): ReactElement => (
  <Link
    href={`/structures/${structureId}/tarification`}
    className="fr-btn fr-btn--secondary fr-btn--sm whitespace-nowrap"
  >
    Tarification
  </Link>
);

type Props = {
  structureId: number;
};
