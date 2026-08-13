"use client";

import Image from "next/image";
import { ReactElement, useState } from "react";

export const OperateurLogo = ({ name, size = 80, url }: Props): ReactElement => {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowPlaceholder = !url || hasImageError;

  return (
    <div
      className="relative mr-10"
      style={{ width: `${size}px`, aspectRatio: "1" }}
    >
      <Image
        src={shouldShowPlaceholder ? "/logo.svg" : url}
        alt={`Logo ${name}`}
        fill
        loading="eager"
        onError={() => setHasImageError(true)}
        style={{ objectFit: "contain" }}
      />
    </div>
  );
};

type Props = {
  name: string;
  size?: number;
  url: string | null;
};
