-- CreateTable
CREATE TABLE "reporting"."MonthlyReportingMetric" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "visitsCount" INTEGER NOT NULL,
    "readsCount" INTEGER NOT NULL,
    "updatesCount" INTEGER NOT NULL,
    "structuresUpdatedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyReportingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."MonthlySupportContact" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "phoneCallsCount" INTEGER,
    "emailsCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySupportContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."MonthlyStructuresGlobalQualityCount" (
    "id" SERIAL NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "structuresCount" INTEGER NOT NULL,
    "indicatorsCount" INTEGER NOT NULL,
    "issuesCountSum" INTEGER NOT NULL,
    "has_authorisation_dates_undefined" INTEGER NOT NULL,
    "has_issue_authorisation_period_not_15y" INTEGER NOT NULL,
    "has_convention_dates_undefined" INTEGER NOT NULL,
    "has_issue_authorized_convention_not_5y" INTEGER NOT NULL,
    "has_issue_authorized_convention_outside_authorisation_period" INTEGER NOT NULL,
    "has_issue_authorized_convention_missing_or_expired" INTEGER NOT NULL,
    "has_issue_evaluation_not_done_in_time" INTEGER NOT NULL,
    "has_issue_subsidized_convention_gt_3y" INTEGER NOT NULL,
    "has_issue_specific_places_gt_places_autorisees" INTEGER NOT NULL,
    "has_issue_places_structure_vs_address_diff_gt_10pct" INTEGER NOT NULL,
    "has_issue_dept_code" INTEGER NOT NULL,
    "has_issue_multi_dna" INTEGER NOT NULL,
    "has_issue_cpom_mono_structure" INTEGER NOT NULL,
    "has_issue_taux_encadrement_max_gt_25" INTEGER NOT NULL,
    "has_issue_taux_encadrement_min_eq_0" INTEGER NOT NULL,
    "has_issue_cout_journalier_max_gt_35" INTEGER NOT NULL,
    "has_issue_cout_journalier_min_lt_15" INTEGER NOT NULL,
    "has_issue_resultat_net_eq_0" INTEGER NOT NULL,
    "has_issue_authorized_affectations_breakdown_missing" INTEGER NOT NULL,
    "has_issue_authorized_reprise_plus_affectations_mismatch" INTEGER NOT NULL,
    "has_issue_subsidized_deficit_nonzero_boxes" INTEGER NOT NULL,
    "has_issue_subsidized_excedent_rules" INTEGER NOT NULL,
    "has_issue_excedent_left_in_report_a_nouveau" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyStructuresGlobalQualityCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReportingMetric_month_key" ON "reporting"."MonthlyReportingMetric"("month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySupportContact_month_key" ON "reporting"."MonthlySupportContact"("month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyStructuresGlobalQualityCount_month_key" ON "reporting"."MonthlyStructuresGlobalQualityCount"("month");
