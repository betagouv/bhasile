import { redirect } from "next/navigation";
import { ReactElement } from "react";

export default function Home(): ReactElement {
  console.log("Bonjour, c'est la PR 1000");
  redirect("/structures");
}
