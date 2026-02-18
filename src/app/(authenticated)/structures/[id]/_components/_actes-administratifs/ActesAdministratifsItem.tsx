import { DownloadItem } from "@/app/components/common/DownloadItem";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsItem = ({
  acteAdministratif,
  isCpom,
}: Props) => {
  const { structure } = useStructureContext();

  const avenantsOfItem = (
    isCpom
      ? structure.cpomStructures
          ?.flatMap((cpomStructure) => cpomStructure.cpom?.actesAdministratifs)
          .filter(
            (avenant) => avenant && avenant.parentId === acteAdministratif.id
          )
      : structure.actesAdministratifs?.filter(
          (avenant) => avenant.parentId === acteAdministratif.id
        )
  )?.map((avenant, index) => ({
    ...avenant,
    index: index + 1,
  })) as (ActeAdministratifApiType & { index: number })[];

  return (
    <>
      <div>
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
  isCpom: boolean;
};
