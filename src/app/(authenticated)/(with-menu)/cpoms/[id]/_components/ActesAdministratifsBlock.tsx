"use client";

import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { DownloadItem } from "@/app/components/common/DownloadItem";
import { getCpomStructureTypes } from "@/app/utils/cpom.util";
import { StructureType } from "@/types/structure.type";

import { useCpomContext } from "../_context/CpomClientContext";

const CPOM_SCOPE = "CPOM";

export const ActesAdministratifsBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const actesAdministratifs = cpom.actesAdministratifs ?? [];
  const scopes: (StructureType | typeof CPOM_SCOPE)[] = [
    CPOM_SCOPE,
    ...getCpomStructureTypes(cpom),
  ];

  const getScopeActes = (scope: StructureType | typeof CPOM_SCOPE) => {
    const structureType = scope === CPOM_SCOPE ? null : scope;
    return actesAdministratifs.filter(
      (acteAdministratif) =>
        (acteAdministratif.structureType ?? null) === structureType
    );
  };

  return (
    <Block
      title="Actes administratifs du CPOM"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/actes-administratifs`);
      }}
      entity={cpom}
      entityType="Cpom"
    >
      {actesAdministratifs.length === 0 ? (
        <>Aucun document importé</>
      ) : (
        scopes.map((scope) => {
          const scopeActes = getScopeActes(scope);
          if (scopeActes.length === 0) {
            return null;
          }
          const conventions = scopeActes.filter(
            (acteAdministratif) => !acteAdministratif.parentId
          );
          const avenants = scopeActes.filter(
            (acteAdministratif) => acteAdministratif.parentId
          );
          return (
            <Accordion label={scope} key={scope}>
              <div className="grid grid-cols-3 gap-5">
                {conventions.map((convention) => (
                  <div key={convention.id}>
                    <DownloadItem item={convention} />
                  </div>
                ))}
                {avenants.map((avenant, index) => (
                  <div key={avenant.id}>
                    <DownloadItem item={avenant} index={index + 1} />
                  </div>
                ))}
              </div>
            </Accordion>
          );
        })
      )}
    </Block>
  );
};
