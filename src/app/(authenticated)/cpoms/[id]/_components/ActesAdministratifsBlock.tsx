"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { DownloadItem } from "@/app/components/common/DownloadItem";

import { useCpomContext } from "../_context/CpomClientContext";

export const ActesAdministratifsBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const conventions = cpom.actesAdministratifs?.filter(
    (acteAdministratif) => !acteAdministratif.parentId
  );
  const avenants = cpom.actesAdministratifs?.filter(
    (acteAdministratif) => acteAdministratif.parentId
  );
  return (
    <Block
      title="Document de convention du CPOM"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/actes-administratifs`);
      }}
    >
      <div className="grid grid-cols-3 gap-5">
        {conventions?.map((convention) => (
          <div key={convention.id}>
            <DownloadItem item={convention} />
          </div>
        ))}
        {avenants?.map((avenant, index) => (
          <div key={avenant.id}>
            <DownloadItem item={avenant} index={index + 1} />
          </div>
        ))}
      </div>
    </Block>
  );
};
