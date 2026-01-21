import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import {
  validCada1,
  validCada2,
  validCada3,
  validCada4,
  validCada5,
  validCph1,
  validCph2,
  validCph3,
  validHuda1,
  validHuda2,
  validHuda3,
  validCaes1,
  validCaes2,
  validCaes3,
  validCadaEdgeCase,
} from "./helpers/test-data/valid-scenarios";

const validTestCases = [
  { name: "CADA 1 - Collectif, same address, one contact, all docs, old eval, controls", config: validCada1 },
  { name: "CADA 2 - Diffus, multiple addresses, two contacts, no docs, recent eval", config: validCada2 },
  { name: "CADA 3 - Mixte, multiple addresses, one contact, mixed docs, old+recent eval", config: validCada3 },
  { name: "CADA 4 - Collectif, single address, two contacts, all docs, TODO remove eval", config: validCada4 },
  { name: "CADA 5 - Diffus, 3+ addresses, one contact, no docs, recent eval with plan", config: validCada5 },
  { name: "CPH 1 - Collectif, single address, one contact, all docs, old eval, filiale", config: validCph1 },
  { name: "CPH 2 - Mixte, multiple addresses, two contacts, mixed docs, recent eval", config: validCph2 },
  { name: "CPH 3 - Diffus, multiple addresses, one contact, no docs, TODO remove eval", config: validCph3 },
  { name: "HUDA 1 - Collectif, single address, one contact, all docs, TODO remove eval", config: validHuda1 },
  { name: "HUDA 2 - Diffus, multiple addresses, two contacts, mixed docs, controls", config: validHuda2 },
  { name: "HUDA 3 - Mixte, multiple addresses, one contact, no docs", config: validHuda3 },
  { name: "CAES 1 - Collectif, single address, two contacts, all docs, filiale", config: validCaes1 },
  { name: "CAES 2 - Diffus, multiple addresses, one contact, mixed docs, controls", config: validCaes2 },
  { name: "CAES 3 - Mixte, multiple addresses, one contact, no docs", config: validCaes3 },
  { name: "CADA Edge Case - Large structure, 5+ addresses, multiple evals/controls", config: validCadaEdgeCase },
];

for (const { name, config } of validTestCases) {
  test(`${name} - Flux complet (création, finalisation, modification)`, async ({
    page,
  }) => {
    const formData = await beforeFlow(config, page);

    try {
      await completeStructureFlow(page, formData);
    } finally {
      await deleteStructureViaApi(formData.dnaCode);
    }
  });
}
