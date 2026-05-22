# Specs — Transformations de structures

## Points d'entrée aux parcours

- **2 CTA dans le header de l'onglet Structure** :
  - "Transformer HUDA en CADA" → parcours HUDA > CADA
  - "Créer une structure" → parcours de création
- **Menu déroulant dans le header des pages structure**, item "Extension, contraction ou fermeture" → parcours d'extension/contraction/fermeture. Affiché uniquement pour les agents des régions/départements des structures concernées.

## Mode focus

Les formulaires s'ouvrent en mode focus :

- **Sidebar de navigation contextuelle** (fond bleu, remplace la nav principale). Une fois le cas de figure précisé, la sidebar se développe pour lister chaque brique et ses étapes. La navigation est non-linéaire : on peut cliquer sur n'importe quelle étape.
- **Header** : bouton "Quitter" s'ajoute au bouton "Précédent". Une fois l'étape 2 "Saisie des données" atteinte, cliquer sur l'un des deux ouvre une [pop-in de confirmation](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=9406-18918) (enregistrer ou non). Avant l'étape 2, retour direct sans pop-in. Dans les deux cas, l'utilisateur revient sur la page d'entrée du parcours.
- **Bouton "Annuler la démarche"** : quitte le formulaire et supprime l'éventuelle sauvegarde. Pop-up de confirmation.

## Structure du formulaire (3 parties)

### 1. Cas de figure
L'utilisateur précise la situation, parfois en plusieurs étapes.

- Si on vient d'une page structure (via "Extension, contraction ou fermeture"), les infos de cette structure sont affichées.
- Quand l'utilisateur doit sélectionner des structures : 3 filtres (parfois verrouillés ou absents selon le contexte). Cliquer sur une structure la sélectionne et la déplace en haut des résultats — même si les filtres changent, les structures sélectionnées restent en haut. Les structures en phase d'initialisation (non finalisées) ne sont pas listées.

### 2. Saisie des données
Le formulaire se génère à partir de briques selon le cas de figure.

### 3. Vérification
Récapitulatif de toutes les briques avec les structures correspondantes. Les titres de blocs (ex : "Fermeture" / "Fermetures") s'accordent en nombre selon les structures concernées.

## Briques disponibles

- `creation-ex-nihilo`
- `creation-a-partir-de-structures`
- `extension`
- `contraction`
- `fermeture`

## Parcours et composition en briques

### Transformation HUDA > CADA
| Cas de figure | Briques |
|---|---|
| Un ou plusieurs HUDA ferment → places transférées à un CADA existant (même opérateur) | N fermetures + 1 extension |
| Un ou plusieurs HUDA ferment → places transférées à un nouveau CADA (même opérateur) | N fermetures + 1 création à partir de structures |
| Un ou plusieurs HUDA ferment → places remises en concurrence | N fermetures (pas de lien historique avec les structures créées ensuite) |

### Création de structures
| Cas de figure | Briques |
|---|---|
| Nouvelle structure créée ex-nihilo | 1 création ex-nihilo |
| Structure créée à partir des places de structures qui ferment | N fermetures + 1 création à partir de structures |

### Extension, contraction ou fermeture
| Cas de figure | Briques |
|---|---|
| Extension — nouvelles places issues de structures non fermées (contraction) | N contractions + 1 extension |
| Extension — nouvelles places issues de structures ayant fermé | N fermetures + 1 extension |
| Extension — nouvelles places créées | 1 extension |
| Contraction — places transférées à d'autres structures existantes | 1 contraction + N extensions |
| Contraction — places non transférées | 1 contraction |
| Fermeture — places transférées à d'autres structures existantes | 1 fermeture + N extensions |
| Fermeture — places non transférées | 1 fermeture |

> Les mêmes briques peuvent avoir des différences subtiles selon le point d'entrée (ex. une extension dans un parcours HUDA>CADA a des documents et bandeaux différents). Se référer aux maquettes. Si un parcours n'a pas de maquettes, ses briques sont identiques aux autres parcours.

## Ordre des briques

1. On commence toujours par les fermetures ou les contractions.
2. S'il y a plusieurs briques du même type, elles sont ordonnées par code Bhasile croissant.

## Pré-remplissage conditionnel

**Extension ou contraction :**
- Nom de la structure → de la structure faisant l'objet de l'extension/contraction
- Adresse administrative principale → idem
- Noms et adresses des sites → idem + des structures qui transfèrent leurs places
- Contacts → idem
- Adresses d'hébergement et champs associés → idem

**Création à partir de structures :**
- Noms et adresses des sites → des structures qui transfèrent leurs places
- Contacts → idem
- Adresses d'hébergement et champs associés → idem

## Comportements spécifiques

### Suppression et quantité minimum d'éléments
Dans les formulaires d'extension/contraction/création à partir de structures, les listes pré-remplies (sites administratifs, contacts, adresses d'hébergement) ont un comportement particulier : la poubelle est affichée (contrairement aux formulaires classiques), mais l'utilisateur doit respecter un minimum. Si l'utilisateur tente de descendre en dessous du minimum, les champs de la ligne sont réinitialisés (vidés) et la poubelle disparaît.

- Sites administratifs : minimum **2**
- Contacts : minimum **1**
- Adresses d'hébergement : minimum **1**

### Affichage conditionnel
- Champs des adresses d'hébergement : dépendent du **type de bâti** saisi.
- Création ex-nihilo : le téléversement des adresses via tableur n'est affiché que pour le bâti **diffus ou mixte**.
- Création (ex-nihilo ou à partir de structures) : les documents demandés dépendent du **type de structure** (autorisé ou subventionné). Pour une création à partir de structures, on laisse le choix entre un arrêté d'autorisation et un arrêté de fusion.
- Bloc numéro FINESS : jamais affiché pour les extensions/contractions. Pour les créations, absent pour les CAES (subventionnés). Pour les créations ex-nihilo, le bloc ne s'affiche qu'après la saisie du type de structure.

### Boutons radio
- Étapes "Description" : boutons radio décochés par défaut.
- Étapes "Actes administratifs" : premier choix coché par défaut.
- Extension/contraction — adresse administrative principale changée ?
  - Sans réponse : champs (nom + adresse) affichés en mode verrouillé.
  - "Oui" : champs déverrouillés et vidés.
  - Retour sur "Non" : adresse d'origine verrouillée.
- Extension/contraction/création — structure répartie en sites administratifs ?
  - Aucun champ affiché par défaut. Si "Oui" : champs affichés (pré-remplis selon règles ci-dessus).
- Actes administratifs — type de document :
  - Convention / avenant convention : l'avenant fait apparaître "date du document" et "fin convention actualisée".
  - Arrêté d'extension (ou actant la contraction) / avenant arrêté d'autorisation : l'avenant fait apparaître "date du document" et "fin arrêté actualisée" ; l'appel d'offre fait apparaître uniquement "date du document".
  - Nommage dans la page structure : `[TYPE DU DOCUMENT] MM/AAAA`.

### Codes DNA / FINESS
- Par défaut : un seul code, un seul champ "code".
- Si l'utilisateur ajoute un second code : une deuxième ligne apparaît et chaque code dispose d'un champ "description".
- Le champ code DNA est en **autocomplete** : l'utilisateur ne peut sélectionner qu'un code connu en base.

### Champ "nombre total de places autorisées"
Pour les extensions/contractions, un message d'information (inhérent au composant) indique la différence avec le nombre de places précédent.

## Formulaires non finalisés

### Enregistrement
Pas d'autosave. Un bouton "Enregistrer l'avancée" dans le header sauvegarde l'état courant (icône disquette → cercle de chargement → disquette, [voir maquette](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=8954-43434)). La sauvegarde est accessible uniquement sur le compte de l'agent qui l'a créée.

### Structures existantes concernées
Pour les structures faisant l'objet d'une extension/contraction en cours : quand un agent habilité accède à la page de la structure, [une pop-in](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=9718-24779) l'invite à terminer la transformation. Si l'agent clique sur "Extension contraction ou fermeture" alors qu'une démarche est déjà en cours, [une autre pop-in](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=9718-24803) l'informe qu'il doit d'abord terminer ou annuler la démarche existante.

### Mini tableau
Dès qu'un formulaire est quitté en cours de complétion, un tableau s'ajoute à la vue "Tableau" de l'onglet Structure. Il est visible par tous les agents DREETS/DDETS responsables des structures concernées, et donne accès au formulaire pour le finaliser.

## Finalisation (étape "Vérification")

Bouton "Je confirme et certifie les informations" :

- **Erreurs/oublis** : message d'erreur sous le bouton + pastille rouge sur les étapes concernées dans la navigation. [Voir maquette](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=8954-44247).
- **Tout correct** : [pop-in de confirmation](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=9477-18994). L'utilisateur clique "J'ai compris" et est redirigé vers la page d'entrée du parcours (onglet Structure ou page structure).
- **Cas particulier — remise en concurrence (HUDA>CADA)** : [pop-in différente](https://www.figma.com/design/UsVwsumr0CZUJ3UypapLHH/Maquettes-v2?node-id=9477-19056) invitant à saisir les structures induites par la remise en concurrence si elles sont déjà définies.
