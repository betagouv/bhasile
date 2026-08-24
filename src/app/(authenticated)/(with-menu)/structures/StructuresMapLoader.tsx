"use client";

import dynamic from "next/dynamic";

import Loader from "@/app/components/ui/Loader";

export const StructuresMapLoader = dynamic(
  () => import("./_components/StructuresMap"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Loader />
      </div>
    ),
    ssr: false,
  }
);
