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
      className="[&_.fr-notice\_\_desc]:text-text-default-grey [&_div_div]:px-4 [&_div_div]:py-3 [&_div]:px-0 py-0"
      isClosable
      onClose={onClose}
    />
  );
};
