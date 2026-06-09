import Image from "next/image";
import { ReactElement, useEffect, useState } from "react";

import Loader from "@/app/components/ui/Loader";
import { useFetchState } from "@/app/context/FetchStateContext";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { FileUploadApiType } from "@/schemas/api/file.schema";
import { FetchState } from "@/types/fetch-state.type";

export const OperateurLogo = ({
  name,
  size = 80,
  logo,
  id,
}: Props): ReactElement => {
  const fetchName = `operateur-logo-${id}`;
  const { getFetchState, setFetchState } = useFetchState();
  const fetchState = getFetchState(fetchName);
  const { getFile } = useFileUpload();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      if (!logo?.key) {
        setFetchState(fetchName, FetchState.IDLE);
        return;
      }

      try {
        setFetchState(fetchName, FetchState.LOADING);
        const { fileUrl } = await getFile(logo.key);
        setLogoUrl(fileUrl);
        setImageError(false);
        setFetchState(fetchName, FetchState.IDLE);
      } catch (error) {
        console.error("Erreur lors du chargement du logo:", error);
        setFetchState(fetchName, FetchState.ERROR);
      }
    };

    loadLogo();
  }, [logo?.key, getFile, setFetchState, fetchName]);

  const handleImageError = () => {
    setImageError(true);
  };

  const showPlaceholder =
    fetchState === FetchState.ERROR ||
    (fetchState === FetchState.IDLE && !logoUrl) ||
    imageError;

  return (
    <div
      className="relative mr-10"
      style={{ width: `${size}px`, aspectRatio: "1" }}
    >
      {fetchState === FetchState.LOADING && (
        <div className="flex items-center justify-center h-full w-full">
          <Loader />
        </div>
      )}
      {showPlaceholder && (
        <Image
          src="/logo.svg"
          alt={`Logo ${name}`}
          fill
          loading="eager"
          style={{ objectFit: "contain" }}
        />
      )}
      {fetchState === FetchState.IDLE && logoUrl && !imageError && (
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          fill
          loading="eager"
          onError={handleImageError}
          style={{ objectFit: "contain" }}
        />
      )}
    </div>
  );
};

type Props = {
  name: string;
  size?: number;
  logo?: FileUploadApiType;
  id: number;
};
