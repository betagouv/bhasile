import { ReactElement, useEffect, useState } from "react";

import { useFileUpload } from "@/app/hooks/useFileUpload";
import { formatBytes } from "@/app/utils/number.util";

export const FileItem = ({ fileKey, title }: Props): ReactElement => {
  const [name, setName] = useState("");
  const [size, setSize] = useState(0);
  const { getFile } = useFileUpload();

  const getFileData = async (key?: string) => {
    if (!key) {
      return;
    }
    const fileData = await getFile(key);
    setName(fileData.originalName);
    setSize(fileData.fileSize);
  };

  useEffect(() => {
    getFileData(fileKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-title-blue-france text-sm font-medium mb-0 ">
        {title}
      </h3>
      {fileKey ? (
        <p className="flex gap-2 items-center ">
          <i className="fr-icon-file-text-fill text-action-high-blue-france"></i>
          <span className="flex flex-col gap-1 truncate">
            <span className="text-sm truncate">{name}</span>
            <span className="text-xs text-disabled-grey">
              {formatBytes(size)}
            </span>
          </span>
        </p>
      ) : (
        <p className="text-disabled-grey flex gap-1 text-sm items-center ">
          <i className="fr-icon-close-circle-fill"></i>Pas de fichier
        </p>
      )}
    </div>
  );
};

type Props = {
  title: string;
  fileKey?: string;
};
