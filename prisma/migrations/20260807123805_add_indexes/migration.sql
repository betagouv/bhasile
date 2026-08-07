-- CreateIndex
CREATE INDEX "ActeAdministratif_structureId_idx" ON "ActeAdministratif"("structureId");

-- CreateIndex
CREATE INDEX "ActeAdministratif_cpomId_idx" ON "ActeAdministratif"("cpomId");

-- CreateIndex
CREATE INDEX "ActeAdministratif_operateurId_idx" ON "ActeAdministratif"("operateurId");

-- CreateIndex
CREATE INDEX "ActeAdministratif_structureVersionTransformationId_idx" ON "ActeAdministratif"("structureVersionTransformationId");

-- CreateIndex
CREATE INDEX "ActeAdministratif_parentId_idx" ON "ActeAdministratif"("parentId");

-- CreateIndex
CREATE INDEX "Adresse_structureVersionId_idx" ON "Adresse"("structureVersionId");

-- CreateIndex
CREATE INDEX "Antenne_structureVersionId_idx" ON "Antenne"("structureVersionId");

-- CreateIndex
CREATE INDEX "Contact_structureVersionId_idx" ON "Contact"("structureVersionId");

-- CreateIndex
CREATE INDEX "Contact_operateurId_idx" ON "Contact"("operateurId");

-- CreateIndex
CREATE INDEX "Controle_structureId_idx" ON "Controle"("structureId");

-- CreateIndex
CREATE INDEX "Cpom_operateurId_idx" ON "Cpom"("operateurId");

-- CreateIndex
CREATE INDEX "Cpom_regionId_idx" ON "Cpom"("regionId");

-- CreateIndex
CREATE INDEX "CpomDepartement_departementId_idx" ON "CpomDepartement"("departementId");

-- CreateIndex
CREATE INDEX "CpomStructure_structureId_idx" ON "CpomStructure"("structureId");

-- CreateIndex
CREATE INDEX "Dna_operateurId_idx" ON "Dna"("operateurId");

-- CreateIndex
CREATE INDEX "Dna_departementAdministratif_idx" ON "Dna"("departementAdministratif");

-- CreateIndex
CREATE INDEX "DnaStructure_dnaId_idx" ON "DnaStructure"("dnaId");

-- CreateIndex
CREATE INDEX "DocumentFinancier_structureId_idx" ON "DocumentFinancier"("structureId");

-- CreateIndex
CREATE INDEX "DocumentFinancier_cpomId_idx" ON "DocumentFinancier"("cpomId");

-- CreateIndex
CREATE INDEX "Evaluation_structureId_idx" ON "Evaluation"("structureId");

-- CreateIndex
CREATE INDEX "EvenementIndesirableGrave_dnaCode_idx" ON "EvenementIndesirableGrave"("dnaCode");

-- CreateIndex
CREATE INDEX "FileUpload_acteAdministratifId_idx" ON "FileUpload"("acteAdministratifId");

-- CreateIndex
CREATE INDEX "FileUpload_documentFinancierId_idx" ON "FileUpload"("documentFinancierId");

-- CreateIndex
CREATE INDEX "FileUpload_controleId_idx" ON "FileUpload"("controleId");

-- CreateIndex
CREATE INDEX "FileUpload_evaluationId_idx" ON "FileUpload"("evaluationId");

-- CreateIndex
CREATE INDEX "Note_structureId_idx" ON "Note"("structureId");

-- CreateIndex
CREATE INDEX "Note_userId_idx" ON "Note"("userId");

-- CreateIndex
CREATE INDEX "RoleDepartement_roleId_idx" ON "RoleDepartement"("roleId");

-- CreateIndex
CREATE INDEX "Structure_operateurId_idx" ON "Structure"("operateurId");

-- CreateIndex
CREATE INDEX "Structure_departementAdministratif_idx" ON "Structure"("departementAdministratif");

-- CreateIndex
CREATE INDEX "StructureFiness_finessId_idx" ON "StructureFiness"("finessId");

-- CreateIndex
CREATE INDEX "StructureVersionTransformation_transformationId_idx" ON "StructureVersionTransformation"("transformationId");

-- CreateIndex
CREATE INDEX "StructureVersionTransformation_operateurId_idx" ON "StructureVersionTransformation"("operateurId");
