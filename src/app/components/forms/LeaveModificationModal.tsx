import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const modal = createModal({
  id: `leave-modification-modal`,
  isOpenedByDefault: false,
});

export const LeaveModificationModal = ({
  resetRoute,
  shouldOpen,
  setShouldOpen,
}: Props) => {
  const router = useRouter();

  const isOpen = useIsModalOpen(modal);

  useEffect(() => {
    if (shouldOpen) {
      modal.open();
    }
  }, [shouldOpen]);

  useEffect(() => {
    if (!isOpen) {
      setShouldOpen(false);
    }
  }, [isOpen, setShouldOpen]);

  return (
    <modal.Component
      title={
        "Vous êtes sur le point de quitter un formulaire en cours de modification."
      }
      buttons={[
        {
          doClosesModal: true,
          children: "Revenir au formulaire",
          type: "button",
          onClick: () => {
            setShouldOpen(false);
          },
        },
        {
          doClosesModal: false,
          children: "Quitter le formulaire",
          type: "button",
          onClick: () => {
            router.push(resetRoute);
          },
        },
      ]}
      className="[&_h1]:text-left! [&_p]:text-left!"
    >
      Si vous quittez le formulaire maintenant sans sauvegarder, vos
      modifications ne seront pas conservées.
    </modal.Component>
  );
};

type Props = {
  resetRoute: string;
  shouldOpen: boolean;
  setShouldOpen: (shouldOpen: boolean) => void;
};
