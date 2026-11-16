import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useId, useMemo } from "react";

import { EmptyCell } from "@/app/components/common/EmptyCell";

export const BudgetTableCommentStaticButtonAndModal = ({
  year,
  commentaire,
}: Props) => {
  const modalId = useId();
  const modal = useMemo(
    () =>
      createModal({
        id: modalId,
        isOpenedByDefault: false,
      }),
    [modalId]
  );

  return (
    <>
      {commentaire ? (
        <Button
          type="button"
          iconId="fr-icon-eye-line"
          onClick={() => modal.open()}
          priority="tertiary no outline"
          size="small"
          className="font-bold"
        >
          Voir
        </Button>
      ) : (
        <EmptyCell />
      )}
      <modal.Component
        title="Voir le commentaire"
        className="[&_h1]:text-left! [&_h2]:text-left! [&_p]:text-left!"
      >
        <h2 className="text-sm">Détail affectation du résultat - {year}</h2>
        <p>{commentaire}</p>
      </modal.Component>
    </>
  );
};

type Props = {
  year: number;
  commentaire?: string | null;
};
