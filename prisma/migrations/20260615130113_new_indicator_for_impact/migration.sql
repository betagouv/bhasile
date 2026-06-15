-- Migration ajustée manuellement :
-- - Renommage de has_issue_subsidized_reprise_etat_nonzero
--   → has_issue_subsidized_excedent_reprise_etat_nonzero (préserve les données)
-- - Ajout de has_issue_authorized_affectations_breakdown_mismatch
--   (détail affectation renseigné mais somme ≠ affectationReservesFondsDedies)

ALTER TABLE "reporting"."monthly_structures_global_quality_count"
  RENAME COLUMN "has_issue_subsidized_reprise_etat_nonzero"
  TO "has_issue_subsidized_excedent_reprise_etat_nonzero";

ALTER TABLE "reporting"."monthly_structures_global_quality_count"
  ADD COLUMN "has_issue_authorized_affectations_breakdown_mismatch" INTEGER;
