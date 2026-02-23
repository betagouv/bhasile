import prettyBytes from "pretty-bytes";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { getYearFromDate } from "@/app/utils/date.util";
import { getCategoryLabel } from "@/app/utils/file-upload.util";
import { DocumentFinancierGranularity } from "@/generated/prisma/enums";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";

import { DocumentGranularityBadge } from "./DocumentGranularityBadge";

export const DownloadItem = ({
  item,
  displayGranularity = false,
  index,
}: Props) => {
  const { getDownloadLink } = useFileUpload();

  const getFileType = (filename: string): string => {
    const extension = filename.split(".").pop() || "";
    return extension.toUpperCase();
  };

  const openLink = async () => {
    const link = await getDownloadLink(item.fileUploads?.[0]?.key || "");
    window.open(link);
  };

  const getFileLabel = (): string => {
    if (item.name && item.name !== "Document") {
      return item?.name;
    } else {
      const avenant = index ? `Avenant ${index} ` : "";
      const categoryLabel = getCategoryLabel(item.category);
      let years: string = "";
      if ("year" in item && typeof item.year === "number") {
        years = `${item.year}`;
      }
      if ("date" in item && item.date) {
        years = `${getYearFromDate(item.date)}`;
      }
      if (
        "startDate" in item &&
        "endDate" in item &&
        item.startDate &&
        item.endDate
      ) {
        years = `${getYearFromDate(item.startDate)} - ${getYearFromDate(item.endDate)}`;
      }
      return `${avenant}${categoryLabel} ${years}`;
    }
  };

  if (!item.fileUploads?.[0]?.key) {
    return null;
  }

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
              granularity={
                (item as DocumentFinancierApiType)
                  .granularity as DocumentFinancierGranularity
              }
            />
          </div>
        )}
        {getFileType(item.fileUploads?.[0].originalName || "")} -{" "}
        {prettyBytes(item.fileUploads?.[0].fileSize || 0)}
      </div>
    </div>
  );
};

type Props = {
  item: ActeAdministratifApiType | DocumentFinancierApiType;
  displayGranularity?: boolean;
  index?: number;
};
