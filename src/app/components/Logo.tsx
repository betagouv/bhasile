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
      <div className="relative h-[48] w-[150]">
        <Image src="/logo.svg" alt="Logo Bhasile" fill loading="eager" />
      </div>
    </Link>
  );
};
