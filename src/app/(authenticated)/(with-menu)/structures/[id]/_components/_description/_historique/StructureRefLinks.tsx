import Link from "next/link";
import { Fragment, ReactElement } from "react";

import { StructureRef } from "@/types/structure-history.type";

const listFormatter = new Intl.ListFormat("fr", { type: "conjunction" });

type Props = {
  refs: StructureRef[];
};

export const StructureRefLinks = ({ refs }: Props): ReactElement => {
  const parts = listFormatter.formatToParts(refs.map((ref) => ref.codeBhasile));

  return (
    <>
      {parts.map((part, index) => {
        const structureRef =
          part.type === "element"
            ? refs.find((ref) => ref.codeBhasile === part.value)
            : undefined;

        if (!structureRef) {
          return <Fragment key={`literal-${index}`}>{part.value}</Fragment>;
        }

        return (
          <Link
            key={structureRef.codeBhasile}
            href={`/structures/${structureRef.id}`}
          >
            {structureRef.codeBhasile}
          </Link>
        );
      })}
    </>
  );
};
