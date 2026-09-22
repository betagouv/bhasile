-- AlterEnum
-- Les trois parcours HUDA existants changent de nom : RENAME conserve la place de la
-- valeur dans l'enum et les lignes suivent sans UPDATE, contrairement à un ADD qui
-- imposerait de migrer les données puis de supprimer les anciennes valeurs.
ALTER TYPE "TransformationType" RENAME VALUE 'TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR' TO 'TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT';
ALTER TYPE "TransformationType" RENAME VALUE 'TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR' TO 'TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU';
ALTER TYPE "TransformationType" RENAME VALUE 'TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES' TO 'TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE';

-- La branche contraction est nouvelle.
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_VERS_CADA_EXISTANT';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_VERS_CADA_NOUVEAU';
ALTER TYPE "TransformationType" ADD VALUE 'TRANSFO_HUDA_CONTRACTION_REMISE_EN_CONCURRENCE';
