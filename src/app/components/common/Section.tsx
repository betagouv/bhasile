import { ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";

type SectionProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const Section = ({ id, children, className }: SectionProps) => {
  return (
    <section className={cn("scroll-margin-header px-3", className)} id={id}>
      {children}
    </section>
  );
};
