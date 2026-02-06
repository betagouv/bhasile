import Image from "next/image";
import Link from "next/link";
import { ReactElement } from "react";

export const Logo = (): ReactElement => {
  return (
    <Link
      className="flex justify-center items-center"
      href="/"
      title="Accueil - Bhasile"
    >
      <Image
        src="/logo.webp"
        alt="Logo Bhasile"
        width={93}
        height={32}
        loading="eager"
      />
    </Link>
  );
};
