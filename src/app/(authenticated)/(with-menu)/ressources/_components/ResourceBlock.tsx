"use client";

import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { ReactElement, ReactNode, useState } from "react";

import { CountCircle } from "@/app/components/common/CountCircle";
import { countLinks } from "@/app/utils/ressources.util";
import { Block } from "@/types/ressources.type";

import { FaqTabPanel } from "./FaqTabPanel";
import { FilesTabPanel } from "./FilesTabPanel";

export const ResourceBlock = ({ block }: Props): ReactElement | null => {
  const [chosenTabId, setChosenTabId] = useState<string | null>(null);

  const tabViews = buildTabViews(block);

  if (tabViews.length === 0) {
    return null;
  }

  const activeTabView =
    tabViews.find((tabViewItem) => tabViewItem.id === chosenTabId) ??
    tabViews[0];

  return (
    <div className="bg-white pt-6 border border-default-grey rounded-[10px] border-solid overflow-hidden">
      <div className="flex mx-6 mb-8">
        <span className={`text-title-blue-france mr-3 ${block.icon}`} />
        <h3 className="text-title-blue-france fr-h6 mb-0">{block.title}</h3>
      </div>

      <Tabs
        selectedTabId={activeTabView.id}
        onTabChange={setChosenTabId}
        tabs={tabViews.map((tabViewItem) => ({
          tabId: tabViewItem.id,
          label: (
            <span className="flex items-center gap-2">
              {tabViewItem.title}
              {tabViewItem.count !== undefined && (
                <CountCircle count={tabViewItem.count} />
              )}
            </span>
          ),
        }))}
        className="-mx-0.5"
      >
        {activeTabView.panel}
      </Tabs>
    </div>
  );
};

const buildTabViews = (blockItem: Block): TabView[] => {
  if (blockItem.type === "fichiers") {
    return blockItem.tabs.map((tabItem) => ({
      id: tabItem.id,
      title: tabItem.title,
      count: countLinks(tabItem),
      panel: <FilesTabPanel tab={tabItem} />,
    }));
  }

  if (blockItem.type === "faq") {
    return blockItem.tabs.map((tabItem) => ({
      id: tabItem.id,
      title: tabItem.title,
      panel: <FaqTabPanel tab={tabItem} />,
    }));
  }

  const unreachable: never = blockItem;
  throw new Error(`Type de bloc inconnu : ${JSON.stringify(unreachable)}`);
};

type TabView = {
  id: string;
  title: string;
  count?: number;
  panel: ReactNode;
};

type Props = {
  block: Block;
};
