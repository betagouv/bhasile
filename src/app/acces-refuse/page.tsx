import Link from "next/link";

export default function AccesRefuse() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-title-blue-france">
        Accès refusé
      </h1>
      <p className="mt-4 text-lg">
        Vous n’avez pas la permission d’accéder à cette page.
      </p>
      <Link href="/" className="mt-6 text-title-blue-france hover:underline">
        Retour à la connexion
      </Link>
    </div>
  );
}
