export const FILE_DELETION_ERROR_MESSAGE =
  "Erreur lors de la suppression du fichier";

export const confirmFileDeletion = (): boolean =>
  window.confirm(
    "Attention, vous allez supprimer définitivement ce fichier. Êtes-vous bien sûr·e de vouloir continuer ?"
  );
