import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { Page } from "@/types/global";

const Logout = async (props: Page) => {
  const logOutUrl = new URL(
    `${process.env.PRO_CONNECT_BASE_URL}/v2/session/end`
  );
  logOutUrl.searchParams.set(
    "id_token_hint",
    (await props.searchParams).id_token_hint || ""
  );
  logOutUrl.searchParams.set("state", uuidv4());
  logOutUrl.searchParams.set(
    "post_logout_redirect_uri",
    `${process.env.NEXTAUTH_URL}/connexion`
  );
  redirect(logOutUrl.toString());
};

export default Logout;
