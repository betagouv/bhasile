import Notice from "@codegouvfr/react-dsfr/Notice";

import { FormKind } from "@/types/global";

export const NoteDisclaimer = ({ formKind }: Props) => {
  return (
    <Notice
      severity="info"
      title=""
      className="rounded [&_p]:flex [&_p]:items-center [&_.fr-notice\_\_desc]:text-text-default-grey [&_div_div]:px-4 [&_div_div]:py-3 [&_div]:px-0 py-0"
      description={
        formKind === FormKind.FINALISATION
          ? "Veuillez préciser votre nom et la date de l’information pour un meilleur suivi. Ces éléments ne seront pas communiqués aux structures et ne seront partagés qu'aux agents et agentes en charge. "
          : "Afin de centraliser toutes les données concernant cette structure, vous pouvez utiliser cet espace pour annoter les informations nécessaires au pilotage : élément contextuel, prochaine échéance, document à produire, point d'attention, élément relationnel avec la structure... Ces éléments ne seront pas communiqués aux structures et ne seront partagés qu'aux agents et agentes en charge. Veuillez préciser votre nom et la date de l’information pour un meilleur suivi."
      }
    />
  );
};

type Props = {
  formKind: FormKind;
};
