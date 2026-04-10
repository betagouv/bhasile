import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { ReactElement } from "react";

export const User = (): ReactElement => {
  const session = useSession();

  return (
    <div className="flex items-center">
      <div className="bg-active-blue-france text-[white] w-10 h-10 shrink-0 flex items-center justify-center mr-2 rounded-full fr-icon-user-line" />
      <div>
        <p className="text-sm text-title-blue-france">
          {session?.data
            ? session.data?.user?.name || session.data?.user?.email
            : "Chargement..."}
        </p>
        <button
          className="text-xs p-0 fr-icon-logout-box-r-line fr-btn--icon-right after:w-[12]"
          onClick={() => redirect("/deconnexion")}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};
