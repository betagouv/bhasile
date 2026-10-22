"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, ReactNode } from "react";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";
import { cn } from "@/app/utils/classname.util";
import { HeaderFilters } from "@/components/header-filters/HeaderFilters";
import { GlobalFilterKey } from "@/types/filters.type";

export const PageHeader = ({
  title,
  titleId,
  tabs,
  menuActions = [],
  hiddenFilters,
  isSingleZone,
  children,
}: Props): ReactElement => {
  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();

  return (
    <div
      className={cn(
        "sticky top-0 z-50 bg-lifted-grey transition-transform duration-300 ease-in-out",
        isHidden ? "-translate-y-full" : "translate-y-0"
      )}
      ref={headerRef}
    >
      <div className="flex pl-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center bg-lifted-grey">
        <div className="flex items-center">
          <h2 className="text-title-blue-france fr-h5 mb-0 pr-4" id={titleId}>
            {title}
          </h2>
          {tabs}
        </div>
        <div className="flex items-center">
          {menuActions.length > 0 && (
            <div className="relative shrink-0 px-2" ref={panelRef}>
              <Button
                priority="tertiary no outline"
                iconId="ri-more-2-fill"
                title={`Menu ${title}`}
                onClick={() => setIsPanelOpen(!isPanelOpen)}
              />
              {isPanelOpen && (
                <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
                  {menuActions.map((action) =>
                    "href" in action ? (
                      <Button
                        key={action.label}
                        priority="tertiary no outline"
                        linkProps={{ href: action.href }}
                        className="whitespace-nowrap"
                      >
                        {action.label}
                      </Button>
                    ) : (
                      <Button
                        key={action.label}
                        priority="tertiary no outline"
                        onClick={() => {
                          action.onClick();
                          setIsPanelOpen(false);
                        }}
                        className="whitespace-nowrap"
                      >
                        {action.label}
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
          <HeaderFilters
            pageTitle={title}
            hiddenFilters={hiddenFilters}
            isSingleZone={isSingleZone}
          />
        </div>
      </div>
      {children}
    </div>
  );
};

export type PageHeaderAction =
  { label: string; href: string } | { label: string; onClick: () => void };

type Props = {
  title: string;
  titleId?: string;
  tabs?: ReactNode;
  menuActions?: PageHeaderAction[];
  hiddenFilters?: GlobalFilterKey[];
  isSingleZone?: boolean;
  children?: ReactNode;
};
