import prettyBytes from "pretty-bytes";
import { ReactElement } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { getYearFromDate } from "@/app/utils/date.util";
import { getCategoryLabel } from "@/app/utils/file-upload.util";
import { DocumentFinancierGranularity } from "@/generated/prisma/enums";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";

import { DocumentGranularityBadge } from "./DocumentGranularityBadge";

export const DownloadItem = ({
  item,
  displayGranularity = false,
}: Props): ReactElement => {
  const { getDownloadLink } = useFileUpload();

  const getFileType = (filename: string): string => {
    const extension = filename.split(".").pop() || "";
    return extension.toUpperCase();
  };

  const openLink = async () => {
    const link = await getDownloadLink(item.key);
    window.open(link);
  };

  const getFileLabel = (): string => {
    if (
      "categoryName" in item &&
      item.categoryName &&
      item.categoryName !== "Document"
    ) {
      return item?.categoryName;
    } else {
      const categoryLabel = getCategoryLabel(item.category);
      const startYear = getYearFromDate(item.startDate);
      const endYear = getYearFromDate(item.endDate);
      if (startYear === -1 || endYear === -1) {
        return categoryLabel;
      }
      return `${categoryLabel} ${startYear} - ${endYear}`;
    }
  };

  return (
    <div className="inline">
      <button onClick={openLink} className="underline text-title-blue-france">
        <div className="flex text-left">
          {getFileLabel()} <span className="pl-2 fr-icon-eye-line" />
        </div>
      </button>
      <div>
        {displayGranularity && (
          <div className="pr-1 inline">
            <DocumentGranularityBadge
              granularity={item.granularity as DocumentFinancierGranularity}
            />
          </div>
        )}
        {getFileType(item.originalName || "")} -{" "}
        {prettyBytes(item.fileSize || 0)}
      </div>
    </div>
  );
};

type Props = {
  item: ActeAdministratifApiType | DocumentFinancierApiType;
  displayGranularity?: boolean;
};
