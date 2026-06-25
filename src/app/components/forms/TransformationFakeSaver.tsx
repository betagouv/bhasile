import { useEffect } from "react";

import { useOptionalTransformationContext } from "@/app/(authenticated)/structures/transformation/[transformationId]/_context/TransformationClientContext";

export const TransformationFakeSaver = () => {
  const { registerSaver } = useOptionalTransformationContext();

  useEffect(() => {
    registerSaver(async () => true);
    return () => registerSaver(null);
  }, [registerSaver]);

  return null;
};
