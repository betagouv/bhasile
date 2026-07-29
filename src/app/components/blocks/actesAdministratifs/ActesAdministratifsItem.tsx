import { DownloadItem } from "@/app/components/common/DownloadItem";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

type Props = {
  acteAdministratif: ActeAdministratifApiType;
  allActesAdministratifs: ActeAdministratifApiType[];
  showCpomBadge?: boolean;
};

export const ActesAdministratifsItem = ({
  acteAdministratif,
  allActesAdministratifs,
  showCpomBadge = true,
}: Props) => {
  const avenantsOfItem = allActesAdministratifs
    .filter((avenant) => avenant.parentId === acteAdministratif.id)
    .map((avenant, index) => ({
      ...avenant,
      index: index + 1,
    }));

  return (
    <>
      <div>
        <DownloadItem
          item={acteAdministratif}
          cpomInherited={showCpomBadge && acteAdministratif.cpomId != null}
        />
      </div>
      {avenantsOfItem.map((avenant) => (
        <div key={avenant.id}>
          <DownloadItem
            key={avenant.id}
            item={avenant}
            index={avenant.index}
            cpomInherited={showCpomBadge && avenant.cpomId != null}
          />
        </div>
      ))}
    </>
  );
};
