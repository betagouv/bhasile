import { PropsWithChildren } from "react";

export const Block = ({ children }: PropsWithChildren) => (
  <section className="rounded-lg border border-default-grey bg-white p-6">
    {children}
  </section>
);
