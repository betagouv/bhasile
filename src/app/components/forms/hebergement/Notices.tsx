import { Repartition } from "@/types/adresse.type";
import { FormKind } from "@/types/global";

import { Option1Notices } from "./Option1Notices";
import { Option2Notices } from "./Option2Notices";

export const Notices = ({
  typeBati,
  hebergementsContainerRef,
  formKind,
}: Props) => {
  return (
    <div className="flex flex-col gap-6">
      {formKind !== FormKind.MODIFICATION && (
        <div className="flex flex-col gap-6" ref={hebergementsContainerRef}>
          <p className="mb-0">
            Veuillez d&apos;abord renseigner le type de bâti puis
            l&apos;ensemble des adresses d&apos;hébergement de la structure, et
            les informations associées,{" "}
            <strong>au 1er janvier de l&apos;année en cours.</strong>
          </p>

          {typeBati === Repartition.COLLECTIF ? (
            <Option2Notices />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg bg-default-grey-hover p-6 flex flex-col gap-5">
                <div>
                  <h3 className="text-lg text-title-blue-france mb-0">
                    Option 2 - Remplissage manuel
                  </h3>
                  <p className="text-sm text-mention-grey mb-0">
                    (recommandé si moins de 12 adresses à saisir)
                  </p>
                </div>
                <p className="mb-0">
                  Veuillez remplir directement les champs ci-dessous.
                </p>
                <Option2Notices />
              </div>
              <Option1Notices typeBati={typeBati} />
            </div>
          )}
        </div>
      )}
      {formKind === FormKind.MODIFICATION && (
        <div className="flex flex-col gap-3">
          <Option2Notices />
        </div>
      )}
    </div>
  );
};

type Props = {
  typeBati: Repartition;
  hebergementsContainerRef: React.RefObject<null>;
  formKind?: FormKind;
};
