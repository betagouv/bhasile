"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActesAdministratifsCategory } from "@/app/components/blocks/actesAdministratifs/ActesAdministratifsCategory";
import { Block } from "@/app/components/common/Block";
import { getActesCategoriesToDisplay } from "@/app/utils/acteAdministratif.util";
import { CpomActeScope, getCpomActesScopes } from "@/app/utils/cpom.util";
import { ACTE_ADMINISTRATIF_CATEGORY_LABELS } from "@/config/acte-administratif.config";
import { useCpomContext } from "@/contexts/CpomContext";

import { ActesScopeSwitch } from "./ActesScopeSwitch";

export const ActesAdministratifsBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const scopes = getCpomActesScopes(cpom);

  const [currentScope, setCurrentScope] = useState<CpomActeScope>(
    scopes[0].scope
  );

  const currentScopeActes =
    scopes.find((scopeEntry) => scopeEntry.scope === currentScope)
      ?.actesAdministratifs ?? [];
  const categoriesToDisplay = getActesCategoriesToDisplay(currentScopeActes);

  return (
    <Block
      title="Actes administratifs"
      iconClass="fr-icon-file-text-line"
      titleAside={
        scopes.length > 1 ? (
          <ActesScopeSwitch
            scopes={scopes}
            currentScope={currentScope}
            handleChange={setCurrentScope}
          />
        ) : undefined
      }
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/actes-administratifs`);
      }}
      entity={cpom}
      entityType="Cpom"
    >
      {categoriesToDisplay.length === 0 ? (
        <p className="text-disabled-grey mb-0">Aucun document importé</p>
      ) : (
        categoriesToDisplay.map((category) => (
          <ActesAdministratifsCategory
            key={category}
            category={category}
            title={ACTE_ADMINISTRATIF_CATEGORY_LABELS[category]}
            actesAdministratifs={currentScopeActes}
            showCpomBadge={false}
          />
        ))
      )}
    </Block>
  );
};
