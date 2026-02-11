"use client";

import Notice from "@codegouvfr/react-dsfr/Notice";
import { ReactElement, useState } from "react";

import { closeNotice } from "../actions";

export const NameChangeNoticeClient = (): ReactElement | null => {
  const [isVisible, setIsVisible] = useState(true);

  const onClose = async (): Promise<void> => {
    setIsVisible(false);
    await closeNotice();
  };

  if (!isVisible) {
    return null;
  }
  return (
    <Notice
      title="Déployé partout en France, Place d’Asile devient BHASILE."
      description="Seul le nom change, vos données et modalités de connexion restent les mêmes."
      severity="info"
      isClosable
      onClose={onClose}
    />
  );
};
