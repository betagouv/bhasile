import { useEffect, useState } from "react";

import { FaqApiType } from "@/schemas/api/faq.schema";

export const useFaqItems = () => {
  const [faqItems, setFaqItems] = useState<FaqApiType[] | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchFaqItems = async () => {
      try {
        const result = await fetch("/api/faq");
        if (!result.ok) {
          throw new Error(`Failed to fetch faq items: ${result.status}`);
        }
        setFaqItems(await result.json());
      } catch (error) {
        console.error("Error fetching faq items:", error);
        setFaqItems([]);
      }
    };

    fetchFaqItems();
  }, []);

  return { faqItems };
};
