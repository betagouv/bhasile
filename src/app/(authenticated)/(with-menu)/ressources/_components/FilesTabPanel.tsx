import { ReactElement } from "react";

import { FilesTab } from "@/types/ressources.type";

import { DownloadLink } from "./DownloadLink";

export const FilesTabPanel = ({ tab }: Props): ReactElement[] => {
  return tab.sections.map((section, index) => (
    <div
      key={section.id}
      className={index > 0 ? "border-t border-default-grey pt-6 mt-6" : ""}
    >
      {section.title && (
        <h4 className="fr-h6 text-title-blue-france">{section.title}</h4>
      )}
      <div className="grid grid-cols-3 gap-5">
        {section.links.map((link) => (
          <DownloadLink key={link.href} link={link} />
        ))}
      </div>
    </div>
  ));
};

type Props = {
  tab: FilesTab;
};
