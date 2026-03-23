import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Repartition } from "@/types/adresse.type";

export const FiltersBatis = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [batis, setBatis] = useState(
    searchParams.get("bati")?.split(",") || []
  );

  const noFilterOnBati = !searchParams.has("bati");

  const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (noFilterOnBati) {
      const allRepartitions: Repartition[] = [
        Repartition.COLLECTIF,
        Repartition.DIFFUS,
        Repartition.MIXTE,
      ];
      setBatis(allRepartitions.filter((type) => type !== value));
      return;
    }
    if (batis.includes(value)) {
      setBatis(batis.filter((type) => type !== value));
    } else {
      if (batis.length >= 2) {
        setBatis([]);
      } else {
        setBatis([...batis, value]);
      }
    }
  };

  const previousBati = useRef(batis);
  useEffect(() => {
    if (previousBati.current !== batis) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (batis.length === 0) {
        params.set("bati", "none");
      } else {
        params.set("bati", batis.join(","));
      }
      router.replace(`?${params.toString()}`);
      previousBati.current = batis;
    }
  }, [batis, searchParams, router]);

  return (
    <div className="px-6 pt-5 pb-6">
      <fieldset>
        <legend className="text-title-blue-france text-sm font-medium mb-4">
          Bâti
        </legend>
        <div className="grid grid-cols-3 gap-x-3 gap-y-2">
          <Checkbox
            options={[
              {
                label: "Collectif",
                nativeInputProps: {
                  name: "structure-bati",
                  value: "Collectif",
                  checked: batis.includes("Collectif") || noFilterOnBati,
                  onChange: handleTypeChange,
                },
              },
            ]}
            className={"[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"}
            small
          />
          <Checkbox
            options={[
              {
                label: "Diffus",
                nativeInputProps: {
                  name: "structure-bati",
                  value: "Diffus",
                  checked: batis.includes("Diffus") || noFilterOnBati,
                  onChange: handleTypeChange,
                },
              },
            ]}
            className={"[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"}
            small
          />
          <Checkbox
            options={[
              {
                label: "Mixte",
                nativeInputProps: {
                  name: "structure-bati",
                  value: "Mixte",
                  checked: batis.includes("Mixte") || noFilterOnBati,
                  onChange: handleTypeChange,
                },
              },
            ]}
            className={"[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"}
            small
          />
        </div>
      </fieldset>
    </div>
  );
};
