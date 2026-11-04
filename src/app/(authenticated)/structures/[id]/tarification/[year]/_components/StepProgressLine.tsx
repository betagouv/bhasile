import { ReactElement, ReactNode } from "react";

export const StepProgressLine = ({
  label,
  isDone,
  participants,
}: Props): ReactElement => (
  <li className="p-0 flex items-center gap-2 flex-wrap">
    {isDone ? (
      <span aria-hidden className="fr-icon-checkbox-circle-fill fr-icon--sm" />
    ) : (
      <span
        aria-hidden
        className="inline-block size-4 rounded-full border-2 border-white"
      />
    )}
    <span className={isDone ? "font-medium" : "opacity-80"}>{label}</span>
    <span className="sr-only">{isDone ? "(fait)" : "(à faire)"}</span>
    {participants}
  </li>
);

type Props = {
  label: string;
  isDone: boolean;
  participants?: ReactNode;
};
