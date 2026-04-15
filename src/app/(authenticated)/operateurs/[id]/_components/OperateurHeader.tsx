"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { ReactElement, useEffect, useRef } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const OperateurHeader = (): ReactElement | null => {
  const { operateur } = useOperateurContext();

  const { headerRef } = useHeaderHeight();

  const router = useRouter();

  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);
  const currentPath = useRef(pathname);
  useEffect(() => {
    if (currentPath.current !== pathname) {
      previousPath.current = currentPath.current;
      currentPath.current = pathname;
    }
  }, [pathname]);

  const handleBackClick = () => {
    router.back();
  };

  return operateur ? (
    <div className="sticky top-0 z-2 bg-lifted-grey" ref={headerRef}>
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <Button
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
          title="Retour"
          onClick={handleBackClick}
        >
          Retour
        </Button>
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">Opérateur</strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">{operateur.name}</strong>{" "}
          </h3>
        </div>
      </div>
      <NavigationMenu
        menuElements={[
          {
            label: "Description",
            section: "#description",
            isDisplayed: true,
          },
          {
            label: "Documents",
            section: "#documents",
            isDisplayed: true,
          },
        ]}
      />
    </div>
  ) : null;
};
