import { cookies } from "next/headers";
import { ReactElement } from "react";

import { NameChangeNoticeClient } from "./NameChangeNoticeClient";

export const NameChangeNotice = async (): Promise<ReactElement | null> => {
  const cookieStore = await cookies();
  const displayCookie = cookieStore.get("display-name-change");

  if (displayCookie?.value === "false") {
    return null;
  }

  return <NameChangeNoticeClient />;
};
