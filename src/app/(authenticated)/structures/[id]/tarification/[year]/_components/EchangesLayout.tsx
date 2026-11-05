import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, ReactNode } from "react";

import { ECHANGES_TITLE_ID } from "./EchangesDrawer";

export const EchangesLayout = ({
  summary,
  tabs,
  onClose,
  children,
}: Props): ReactElement => (
  <div className="h-full flex flex-col md:flex-row">
    <div className="shrink-0 flex flex-col gap-10 md:w-[18.5rem] md:overflow-y-auto bg-action-low-blue-france pl-8 pr-6 py-6">
      <h2
        id={ECHANGES_TITLE_ID}
        className="flex items-center gap-3 h-10 mb-0 text-xl text-title-blue-france"
      >
        <span aria-hidden className="fr-icon-question-answer-line" />
        Échanges
      </h2>
      {summary}
    </div>
    <div className="grow min-w-0 min-h-0 flex flex-col gap-4 p-6">
      <div className="shrink-0 flex justify-end">
        <Button
          priority="tertiary no outline"
          iconId="fr-icon-close-line"
          title="Fermer les échanges"
          onClick={onClose}
        />
      </div>
      {tabs}
      <div
        id={ECHANGES_PANEL_ID}
        role={tabs ? "tabpanel" : undefined}
        className="grow min-h-0 flex flex-col gap-4"
      >
        {children}
      </div>
    </div>
  </div>
);

export const ECHANGES_PANEL_ID = "echanges-panel";

type Props = {
  summary?: ReactNode;
  tabs?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};
