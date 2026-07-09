import { ReactElement } from "react";

import { BlockTitle } from "./BlockTitle";

type Props = {
  title: string;
  icon: string;
};

export const BlockSkeleton = ({ title, icon }: Props): ReactElement => (
  <section className="m-6 rounded-lg border border-default-grey bg-white">
    <BlockTitle title={title} iconClassName={icon} />
    <p className="border-t border-default-grey px-4 py-6 text-sm text-mention-grey">
      Chargement…
    </p>
  </section>
);
