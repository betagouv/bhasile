# Contenu de la page « Modèles et ressources »

Cette page est alimentée par le S3 placedasile-docs, et la table FAQ dans la DB.

## Ajouter ou modifier du contenu

Un fichier `NN-nom.md` = un bloc de la page (sauf pour la FAQ). Le numéro donne l'ordre d'affichage.
Les fichiers qui commencent par `_` (`_suggestions.md`) ne sont pas des blocs.

Chaque bloc commence par un en-tête :

```
---
type: fichiers
titre: Modèles
icone: fr-icon-file-text-line
---
```

- `type` vaut `fichiers`.
- `icone` vaut `fr-icon-article-line`, `fr-icon-file-text-line`, `fr-icon-folder-2-line` ou `fr-icon-question-answer-line`.

Ensuite, la structure vient des titres :

| Écriture                    | Résultat                      |
| --------------------------- | ----------------------------- |
| `## Titre`                  | un onglet                     |
| `### Titre`                 | un sous-titre avec séparateur |
| `- [Libellé](/fichier.pdf)` | un lien de téléchargement     |

Exemple :

```md
## Actes administratifs

### Structures autorisées

- [Arrêté d'autorisation](/arrete-autorisation.odt)
```

## Ajouter un fichier à télécharger

Déposer le fichier dans `ressources/` du bucket, puis le référencer par son chemin depuis ce dossier.
Si le nom contient des espaces, entourer le lien de chevrons : `[Libellé](</Mon fichier.pdf>)`.

Un bloc invalide (lien mort, en-tête ou titres incorrects) n'est pas affiché : l'erreur est loguée côté serveur.

## Renvoyer vers un site externe

Un lien commençant par `https://` (ou `mailto:`) est accepté tel quel : ni poids ni format
ne sont affichés, puisqu'il n'y a pas de fichier à mesurer.

```md
## Webinaires

- [Webinaire du 12 mars](https://webinaire.gouv.fr/xyz)
```

## FAQ

Les questions viennent de la table `Faq` : un onglet par `category`, questions triées par ordre alphabétique, réponse en Markdown dans `contentMarkdown`.

## Recherches suggérées

`_suggestions.md` contient la liste des mots-clés proposés sous la barre de recherche,
un par ligne, préfixés d'un tiret. Vérifier qu'un mot-clé suggéré remonte bien des résultats.
