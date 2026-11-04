import { ReactElement } from "react";

export const UnreadCountBadge = ({ count }: Props): ReactElement | null => {
  if (count === 0) {
    return null;
  }

  return (
    <>
      {" "}
      <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-action-high-error text-white text-xs font-bold">
        <span aria-hidden="true">{count}</span>
        <span className="fr-sr-only">
          {count === 1 ? "1 non lu" : `${count} non lus`}
        </span>
      </span>
    </>
  );
};

type Props = {
  count: number;
};
