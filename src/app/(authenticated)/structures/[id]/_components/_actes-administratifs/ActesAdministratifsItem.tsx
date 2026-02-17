import { DownloadItem } from "@/app/components/common/DownloadItem";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsItem = ({ acteAdministratif }: Props) => {
  const { structure } = useStructureContext();

  const avenantsOfItem = structure.actesAdministratifs
    ?.filter((avenant) => avenant.parentId === acteAdministratif.id)
    .map((avenant, index) => ({
      ...avenant,
      index: index + 1,
    }));

  return (
    <>
      <div key={acteAdministratif.id}>
        <DownloadItem item={acteAdministratif} />
      </div>
      {avenantsOfItem?.map((avenant) => (
        <div key={avenant.id}>
          <DownloadItem key={avenant.id} item={avenant} index={avenant.index} />
        </div>
      ))}
    </>
  );
};

type Props = {
  acteAdministratif: ActeAdministratifApiType;
};
