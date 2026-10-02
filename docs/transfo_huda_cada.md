# Import des transformations HUDA -> CADA depuis Démarche Numérique

`scripts/recurring-scripts/transfo-huda-cada-fetch.ts` - hypothèses retenues.

## Source

| Hypothèse                     | Choix                                                   |
| ----------------------------- | ------------------------------------------------------- |
| Démarche                      | 128242                                                  |
| États importés                | `accepte`, `en_instruction` - brouillons exclus         |
| Fenêtre                       | aucune, tous les dossiers à chaque run                  |
| Cas « remise en concurrence » | aucun libellé ne le trahit -> skip « type non reconnu » |
| Pièces justificatives         | non rapatriées                                          |

## Identité du dossier

- `Transformation.numeroDossier` = numéro DN, unique. Pas d'enum `source` : rempli ⇒ Démarche Numérique, nul ⇒ agent.
- Dossier déjà importé -> ignoré. Le marquage des étapes n'a lieu qu'à la création.
- Transfo déjà saisie dans Bhasile -> on rattache le `numeroDossier` **si** elle est seule, sans numéro, et porte exactement la même enveloppe. Aucun champ n'est écrasé.

## Enveloppe HUDA

- **Union sans priorité** : codes Bhasile et codes DNA s'additionnent, l'ensemble des structures est le périmètre au départ. Une brique par structure, `FERMETURE` ou `CONTRACTION` selon les places (voir ci-dessous).
- Libellés balayés par motif (`HUDA 2`, apostrophe droite ou typographique), pas par égalité.
- **Tout ou rien sur les codes DNA** : après tentatives de rattrapage (séparateurs, lettre isolée recollée, majuscules, padding du zéro), un seul code encore illisible, inconnu en base ou hors département fait skipper le dossier entier. Le message distingue les trois causes.
- **Le code Bhasile ne bloque que s'il est lisible** : le champ sert de texte libre (`Multi DNA`, `sous CPOM`, `en cours de saisie dans Bhasile`, voire un code DNA). Une valeur qui ne se lit pas comme un code est ignorée sans bloquer, les codes DNA prennent le relais et désignent leurs structures détentrices à date. En revanche un code bien formé mais inconnu en base, fermé ou non-HUDA skippe le dossier, comme un code DNA.
- Corollaire assumé : une faute de frappe qui rend le code illisible passe inaperçue ; une faute qui produit un autre code valide rattache la mauvaise structure sans signal.
- Padding `H209` -> `H0209` retenu si le département du dossier colle **et** que le code padé est rattaché à une version courante. Candidat ignoré sans blocage si le code correct figure déjà dans la saisie.
- Transposition (`H2012` pour `H0212`) jamais corrigée, jamais suggérée : code jeté.
- Contrôle de département sur les deux chiffres qui suivent la lettre ; outre-mer comparé sur `97`, Corse (`2A` / `2B`) non contrôlée.
- Chaque structure doit être de type `HUDA` (type nul refusé) et non fermée.
- Un code Bhasile ne porte qu'une transfo HUDA->CADA en parallèle : une seule structure déjà prise bloque le dossier.

## Cible CADA

- **Unicité** : une extension n'a qu'une structure d'accueil.
- Résolution par code Bhasile, repli sur `Code OFII du CADA`.
- Plus d'une structure -> skip.
- Type `CADA` obligatoire, structure non fermée.

## Dates

- Date effective si renseignée, sinon prévisionnelle (remplie 14/88 vs 88/88).
- Antérieure à `TRANSFORMATION_START_YEAR` -> skip.
- Le rattachement des codes DNA se lit à aujourd'hui, pas à la date d'effet : on veut le détenteur actuel.

## Capacités

| Cas       | Source                                                                                                                     |
| --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Extension | `Nouvelle capacité de l'établissement étendu` (total après extension)                                                      |
| Création  | `Nombre de places de l'établissement transformé`, sinon `Capacité du nouveau CADA créé dans le cadre de la transformation` |

- Écrite aux deux emplacements du formulaire : `structureTypologies[0].placesAutorisees` et `structureVersion.placesAutorisees`.

## Fermeture ou contraction des HUDA

Le libellé du dossier ne donne que la **destination** (CADA existant ou nouveau CADA) ; le sort des HUDA se déduit des places.

| Condition                                     | Brique        |
| --------------------------------------------- | ------------- |
| `0 < transférées < total` et **un seul** HUDA | `CONTRACTION` |
| tout le reste                                 | `FERMETURE`   |

- Les deux champs : `Capacité totale de l'HUDA prévue dans la convention existante` (un seul id, stable sur les 25 révisions) et `Nombre total de places HUDA transformées` (**deux** ids successifs, le champ ayant été remplacé début avril 2026 — le premier renseigné l'emporte).
- **Jamais d'inférence dès qu'un second HUDA est déclaré** : le champ « total » vaut tantôt la somme des deux HUDA, tantôt le premier seul, selon le déclarant. L'unité est indéterminée, aucun calcul ne la retrouve.
- Les places restantes écrites sur la brique viennent de **Bhasile** (version en vigueur à la date d'effet), pas du total déclaré en DN : c'est contre Bhasile que le formulaire valide la saisie. Un restant nul ou négatif retombe en fermeture.
- La remise en concurrence n'a pas de libellé dans la démarche : elle reste saisie à la main.

## Autres pré-remplissages

- Convention de l'extension : début = date d'effet, fin = fin de la convention du CADA **en vigueur à la date d'effet**. Aucune convention à cette date -> rien de pré-rempli, plutôt qu'une date déjà expirée. L'agent corrige.
- Adresses, contacts, antennes : héritées du CADA et des HUDA par le service, toutes conservées. L'agent arbitre celles qui restent.
- Code DNA : lu pour résoudre, **jamais écrit**. Le CADA garde le sien.
- Opérateur du nouveau CADA : celui des HUDA fermés. Des opérateurs divergents laissent le choix ambigu -> skip ; l'agent saisit alors la transfo à la main, où l'opérateur est libre.

## Étapes marquées `PRE_REMPLI`

`01-identification`, `02-places-hebergement`. Le statut s'affiche comme « à compléter » et ne compte pas comme commencé dans le dashboard.

## Robustesse

Un dossier en erreur n'interrompt jamais les suivants. Restitution en fin de run :

```
✅ transformations créées
📎 dossiers rattachés à une transfo existante
🔗 HUDA rattachés via les codes DNA
⚠️ dossiers hors cadre
❌ dossiers en erreur
```

Sortie en code 0 même avec des erreurs.

## Limites assumées

- Aucun contrôle de département commun entre HUDA et CADA : un dossier mêlant plusieurs départements s'importe sans signal (seuls les codes DNA sont contrôlés contre le département du dossier).
- Union sans somme de contrôle : un code DNA erroné ajoute une fermeture définitive, sans signal.
- Libellés dupliqués dans un dossier (sections HUDA puis CADA) : le rattachement se fait par `champDescriptorId`, pas par libellé.
- Après la PR 1534, un HUDA fermé conserve ses codes DNA sur sa version courante - chaque transfo finalisée crée un doublon de code pour les runs suivants.
- Tests `*.repository.test.ts` hors CI, à lancer via `yarn test:db`.
