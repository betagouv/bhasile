import { useEffect } from "react";

import { useTransformationContext } from "@/contexts/TransformationContext";

export const TransformationFakeSaver = () => {
  const { registerSaver } = useTransformationContext();

  useEffect(() => {
    registerSaver(async () => true);
    return () => registerSaver(null);
  }, [registerSaver]);

  return null;
};
