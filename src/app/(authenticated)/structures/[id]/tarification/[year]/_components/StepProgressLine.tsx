import { ReactElement, ReactNode } from "react";

export const StepProgressLine = ({
  label,
  status,
  participants,
}: Props): ReactElement => (
  <li className="p-0 flex items-center gap-2 flex-wrap text-xs text-title-grey">
    {status === "DONE" ? (
      <span
        aria-hidden
        className="fr-icon-checkbox-circle-fill fr-icon--sm text-title-blue-france"
      />
    ) : (
      <span
        aria-hidden
        className={`inline-block size-4 rounded-full border-title-blue-france ${
          status === "NEXT" ? "border-2 border-solid" : "border border-dashed"
        }`}
      />
    )}
    <span>{label}</span>
    <span className="sr-only">{status === "DONE" ? "(fait)" : "(à faire)"}</span>
    {participants}
  </li>
);

export type StepLineStatus = "DONE" | "NEXT" | "LATER";

type Props = {
  label: ReactNode;
  status: StepLineStatus;
  participants?: ReactNode;
};
