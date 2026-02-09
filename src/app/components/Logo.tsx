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
        src="/logo.svg"
        alt="Logo Bhasile"
        width={0}
        height={0}
        loading="eager"
        style={{ width: "40%", height: "auto" }}
      />
    </Link>
  );
};
