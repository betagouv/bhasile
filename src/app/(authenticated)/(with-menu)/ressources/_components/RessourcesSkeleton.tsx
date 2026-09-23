import { ReactElement } from "react";

import { BlockSkeleton } from "../../_components/BlockSkeleton";

export const RessourcesSkeleton = (): ReactElement => {
  return (
    <div className="p-4 grid gap-4">
      <BlockSkeleton title="Modèles" icon="fr-icon-article-line" />
      <BlockSkeleton title="Ressources" icon="fr-icon-folder-2-line" />
      <BlockSkeleton title="FAQ" icon="fr-icon-question-answer-line" />
    </div>
  );
};
