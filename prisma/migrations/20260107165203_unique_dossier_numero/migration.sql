/*
  Warnings:

  - A unique constraint covering the columns `[numeroDossier]` on the table `EvenementIndesirableGrave` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EvenementIndesirableGrave_numeroDossier_key" ON "EvenementIndesirableGrave"("numeroDossier");
