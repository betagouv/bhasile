import { PropsWithChildren } from "react";

export default function ModificationLayout({ children }: PropsWithChildren) {
  return <div className="flex flex-col gap-2 px-2">{children}</div>;
}
