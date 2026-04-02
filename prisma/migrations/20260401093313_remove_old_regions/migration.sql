/*
 Warnings:
 
 - You are about to drop the column `region` on the `Departement` table. All the data in the column will be lost.
 - hand made safe
 */
-- AlterTable
ALTER TABLE "Departement" DROP COLUMN IF EXISTS "region";