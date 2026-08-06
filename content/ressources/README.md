# Contenu de la page « Modèles et ressources »

Cette page est alimentée uniquement par les fichiers de ce dossier. Aucune base de données,
aucun écran d'administration : on modifie un `.md`, on ouvre une pull request, et la page suit.

## Ajouter ou modifier du contenu

Un fichier `NN-nom.md` = un bloc de la page. Le numéro donne l'ordre d'affichage.
Les fichiers qui ne commencent pas par un numéro (`README.md`, `_suggestions.md`) ne sont pas des blocs.

Chaque bloc commence par un en-tête :

```
---
type: fichiers
titre: Modèles
icone: fr-icon-file-text-line
---
```

- `type` vaut `fichiers` (liens à télécharger) ou `faq` (questions/réponses dépliables).
- `icone` est un nom d'icône DSFR (<https://www.systeme-de-design.gouv.fr/fondamentaux/icone>).

Ensuite, la structure vient des titres :

| Écriture                            | Résultat                      |
| ----------------------------------- | ----------------------------- |
| `## Titre`                          | un onglet                     |
| `### Titre` dans un bloc `fichiers` | un sous-titre avec séparateur |
| `### Question ?` dans un bloc `faq` | une question dépliable        |
| `- [Libellé](/fichier.pdf)`         | un lien de téléchargement     |

Exemple pour un bloc `fichiers` :

```md
## Actes administratifs

### Structures autorisées

- [Arrêté d'autorisation](/arrete-autorisation.odt)
```

Exemple pour un bloc `faq` : le texte sous la question est la réponse. Le **gras**, les liens
et les listes à puces fonctionnent.

## Ajouter un fichier à télécharger

Déposer le fichier dans `public/`, puis le référencer par son chemin depuis la racine du site.
Si le nom contient des espaces, entourer le lien de chevrons : `[Libellé](</Mon fichier.pdf>)`.

Tout ce qui est déposé dans `public/` est téléchargeable par n'importe qui, sans connexion, et
part dans l'image déployée : n'y mettre que des documents publiables et de poids raisonnable.

Un lien qui ne correspond à aucun fichier fait **échouer la CI** : une pull request ne peut pas
introduire de lien mort. Un chemin qui sort de `public/` est refusé lui aussi — il ne serait
pas servi en ligne.

## Renvoyer vers un site externe

Un lien commençant par `https://` (ou `mailto:`) est accepté tel quel : ni poids ni format
ne sont affichés, puisqu'il n'y a pas de fichier à mesurer.

```md
## Webinaires

- [Webinaire du 12 mars](https://webinaire.gouv.fr/xyz)
```

## Recherches suggérées

`_suggestions.md` contient la liste des mots-clés proposés sous la barre de recherche,
un par ligne, préfixés d'un tiret. Vérifier qu'un mot-clé suggéré remonte bien des résultats.
