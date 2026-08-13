import Image from "next/image";
import { ReactElement, useEffect, useState } from "react";

import Loader from "@/app/components/ui/Loader";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { useFetchState } from "@/contexts/FetchStateContext";
import { FileUploadApiType } from "@/schemas/api/file.schema";
import { FetchState } from "@/types/fetch-state.type";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const OperateurLogo = ({
  name,
  size = 80,
  logo,
  id,
  maxRetries = 3,
}: Props): ReactElement => {
  const fetchName = `operateur-logo-${id}`;
  const { getFetchState, setFetchState } = useFetchState();
  const fetchState = getFetchState(fetchName);
  const { getFile } = useFileUpload();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    const loadLogo = async () => {
      if (!logo?.key) {
        setFetchState(fetchName, FetchState.IDLE);
        return;
      }

      setFetchState(fetchName, FetchState.LOADING);
      setImageError(false);

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { fileUrl } = await getFile(logo.key);
          if (!isSubscribed) {
            return;
          }

          setLogoUrl(fileUrl);
          setFetchState(fetchName, FetchState.IDLE);
          return;
        } catch (error) {
          console.warn(
            `Tentative ${attempt}/${maxRetries} échouée pour le logo ${id}:`,
            error
          );

          if (attempt < maxRetries) {
            await wait(Math.pow(2, attempt - 1) * 500);
          }
        }
      }

      if (isSubscribed) {
        setFetchState(fetchName, FetchState.ERROR);
      }
    };

    loadLogo();

    return () => {
      isSubscribed = false;
    };
  }, [logo?.key, getFile, setFetchState, fetchName, maxRetries, id]);

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
  maxRetries?: number;
};
