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
}: Props): ReactElement => {
  const { getFetchState, setFetchState } = useFetchState();
  const fetchState = getFetchState("operateur-logo");
  const { getFile } = useFileUpload();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      if (!logo?.key) {
        setFetchState("operateur-logo", FetchState.IDLE);
        return;
      }

      try {
        setFetchState("operateur-logo", FetchState.LOADING);
        const { fileUrl } = await getFile(logo.key);
        setLogoUrl(fileUrl);
        setImageError(false);
        setFetchState("operateur-logo", FetchState.IDLE);
      } catch (error) {
        console.error("Erreur lors du chargement du logo:", error);
        setFetchState("operateur-logo", FetchState.ERROR);
      }
    };

    loadLogo();
  }, [logo?.key, getFile, setFetchState]);

  const handleImageError = () => {
    setImageError(true);
  };

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
      {fetchState === FetchState.ERROR && (
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
      {(fetchState === FetchState.IDLE && !logoUrl) || imageError ? (
        <Image
          src="/logo.svg"
          alt={`Logo ${name}`}
          fill
          loading="eager"
          style={{ objectFit: "contain" }}
        />
      ) : null}
    </div>
  );
};

type Props = {
  name: string;
  size?: number;
  logo?: FileUploadApiType;
};
