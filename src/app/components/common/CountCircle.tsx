import { ReactElement } from "react";

export const CountCircle = ({ count }: Props): ReactElement | null => {
  if (!count) {
    return null;
  }

  return (
    <span className="flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-active-blue-france text-white text-xs font-medium">
      {count}
    </span>
  );
};

type Props = {
  count: number | undefined;
};
