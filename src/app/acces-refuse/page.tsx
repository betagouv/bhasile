import Link from "next/link";

import { BHASILE_CONTACT_EMAIL } from "@/constants";

export default function AccesRefuse() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-title-blue-france">
        Accès refusé
      </h1>
      <p className="mt-4 text-lg">
        Vous n’avez pas la permission d’accéder à cette page.
      </p>
      <Link href="/" className="mt-6 fr-btn">
        Retour à la connexion
      </Link>
      <a
        href={`mailto:${BHASILE_CONTACT_EMAIL}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline mt-6 text-title-blue-france"
      >
        Une question ? Écrivez-nous !
      </a>
    </div>
  );
}
