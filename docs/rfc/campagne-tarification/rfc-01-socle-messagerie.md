# Socle messagerie de la campagne de tarification

Le chantier fait passer dans Bhasile toute la campagne annuelle de tarification des CADA/CPH, du dépôt du CA et du BP par l'opérateur jusqu'aux pièces de paiement. Il repose sur **deux socles**, développés en parallèle et tous deux nécessaires aux briques suivantes :

- le socle **messagerie** (cette RFC) : où et comment opérateurs, DDETS, DREETS et national échangent messages et documents, étape par étape ;
- le socle **donnée** (RFC séparée) : où vivent les montants, compte par compte, pour que les documents soient générés au lieu d'être recopiés.

Cette RFC propose :

- **des threads**, un par **document réglementaire**, par structure et par année de campagne. Il y a **8 types nationaux**, identiques partout : `CA`, `RCA`, `BP`, `L48`, `CONTRADICTOIRE`, `DAB`, `ARRETE`, `PAIEMENT` ;
- **un journal d'événements en ajout seul** : messages, dépôts, issues, réouvertures et notifications sont tous des événements horodatés, jamais modifiés ni supprimés, qui forment la preuve ;
- **un outil descriptif, jamais prescriptif** : les échéances sont affichées et les retards signalés, mais rien n'est jamais bloqué ;
- **des plugins** : des modules de code qui se branchent sur les événements d'un thread. C'est par là qu'arriveront l'extraction des chiffres, l'analyse IA et la génération des documents.

## 1. Contexte

Douze documents par structure et par an. L'opérateur en produit trois (CA, BP, réponse au contradictoire) ; tous les autres reprennent ses chiffres. Une campagne N couvre **tout le cycle de tarification de l'exercice N**, soit environ 15 mois :

| Quand             | Quoi                                         |
| ----------------- | -------------------------------------------- |
| 30 avril N-1      | Dépôt du CA N-2 par l'opérateur              |
| 31 octobre N-1    | Dépôt du BP N par l'opérateur                |
| déc. N-1 → mars N | Rapport sur le CA (RCA), selon le territoire |
| début N           | DAI (douzièmes provisoires)                  |
| ~mai N            | Publication de la DRL au JO : J0             |
| J0 → J48          | Questions-réponses, dialogue de gestion, L48 |
| J48 → J+8         | Contradictoire (le silence vaut accord)      |
| ≤ J60             | DAB                                          |
| sept.-oct. N      | Arrêté de tarification, DAM / échéancier     |

À un instant donné, une structure a donc deux campagnes en cours. En mai 2027, par exemple, la campagne 2027 est en pleine L48 et la campagne 2028 reçoit déjà le CA 2026.

## 2. Objectifs, non-objectifs et hypothèses

**Objectifs**

1. Chaque document réglementaire de la campagne a un lieu unique où il est déposé, discuté, relu et notifié.
2. Les échanges et les dépôts font preuve : horodatés, en ajout seul, avec empreinte.
3. DREETS et national voient l'avancement et les échanges de leur périmètre.
4. Les briques futures (extraction, IA, génération de documents, tableaux de bord) se branchent sans réécrire le socle.
5. Fonctionner sans dev après le chantier : seules des valeurs annuelles (DRL, dates) sont à saisir.

**Non-objectifs**

- Le registre des montants (socle donnée).
- L'extraction des chiffres, l'analyse IA, la génération de documents : ce sont des plugins.
- La signature électronique, l'envoi en recommandé (papier ou électronique, par ex. via Maileva comme en CVL), la saisie Chorus.
- Les circuits de validation internes (règles d'organisation propres à chaque service).
- Le ROB et la DRL en tant que documents (régionaux ou nationaux, pas par structure).
- Les threads multi-structures et les threads libres.

**Hypothèses**

Chacune est à confirmer par les retours sur cette RFC, **avant tout développement**.

| #    | Hypothèse                                                                                                                                                                                                                        | Ce que ça implique                                                                                                | Si c'est faux                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1   | **La réception d'un document par l'opérateur = sa mise à disposition dans Bhasile** (`OUTCOME` + mail), pas sa première consultation.                                                                                            | Les délais opérateur partent de l'`OUTCOME`, et de la dernière en cas de courriers successifs.                    | Si le régime de notification électronique du CRPA s'applique (L112-15, R112-17 à R112-20 ; l'article L100-3 pourrait en exclure les associations gestionnaires) : la réception est la première consultation, ou la mise à disposition + 15 jours, et l'accord exprès préalable de l'opérateur est requis. Il faut alors tracer la première consultation et recalculer les échéances. Le CASF (R314-24 II) fait courir les 8 jours « après réception de chaque courrier ». |
| H2   | **Aucun accusé de lecture n'est nécessaire**, ni comme preuve ni pour l'usage.                                                                                                                                                   | La preuve repose sur l'`OUTCOME` et le mail (§ 4.5).                                                              | Ajouter un événement de première consultation (lié à H1).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| H3   | **La mise à disposition + le mail valent notification**, sans recommandé. L'IdF le pense ; la CVL en doute et garde Maileva.                                                                                                     | Pas d'intégration Maileva / LRE.                                                                                  | Brancher un envoi recommandé comme plugin sur `OUTCOME`.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| H4   | **Les échéances sont en jours calendaires, sans report** (week-end, jour férié). Exemple : le 31/10/2027 est un dimanche.                                                                                                        | Pas de calendrier des jours fériés.                                                                               | Ajouter un calendrier des jours fériés, à maintenir chaque année.                                                                                                                                                                                                                                                                                                                                                                                                         |
| H5   | **Une structure ne change jamais d'opérateur.**                                                                                                                                                                                  | Pas d'`operateurId` sur `Thread`.                                                                                 | Le code le permet aujourd'hui (le PUT agent peut changer l'opérateur) : figer `operateurId` sur `Thread`, décider ce que voit le repreneur.                                                                                                                                                                                                                                                                                                                               |
| H6   | **Les documents financiers restent modifiables** via les formulaires existants, même quand un thread existe.                                                                                                                     | Deux points d'entrée, reliés par le miroir (§ 4.6).                                                               | Le miroir se simplifie.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| H7   | **Le déroulé de la campagne est national** (CASF) ; seule la forme des documents varie selon le territoire.                                                                                                                      | Pas d'activation des types par territoire.                                                                        | Ajouter une activation par type × territoire.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| H8   | **Un document réglementaire = un thread**, avec les précisions H8.1 à H8.6.                                                                                                                                                      | 8 types (§ 4.2).                                                                                                  | Redéfinir les types : sans reprise de données jusqu'à la mise en service, puisqu'aucun thread n'existe avant.                                                                                                                                                                                                                                                                                                                                                             |
| H8.1 | **Le CA et le BP se déposent dans un thread dédié** (`CA`, `BP`).                                                                                                                                                                | Dépôt et vérification dans le thread du document.                                                                 | Les déposer directement dans le thread d'analyse (`RCA`, `L48` : 6 types au lieu de 8), ou via l'onglet Finances existant, observé par le thread (le verdict de vérification arrive alors ailleurs que le dépôt).                                                                                                                                                                                                                                                         |
| H8.2 | **Les questions-réponses et le dialogue de gestion se tiennent dans `BP`.**                                                                                                                                                      | `BP` reste ouvert pendant la campagne.                                                                            | Les tenir dans `L48`.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| H8.3 | **L'onglet Finances reste réservé aux agents** ; les opérateurs déposent dans les threads.                                                                                                                                       | Aucun droit nouveau sur les formulaires existants.                                                                | Ouvrir l'onglet Finances aux opérateurs, avec des droits par catégorie de document financier.                                                                                                                                                                                                                                                                                                                                                                             |
| H8.4 | **`PAIEMENT` est un seul thread**, qui regroupe les documents de paiement de chaque territoire.                                                                                                                                  | Pas d'activation par territoire.                                                                                  | Un thread par pièce (DAI, DAM, échéancier), donc une activation par territoire.                                                                                                                                                                                                                                                                                                                                                                                           |
| H8.5 | **`RCA` est un thread séparé partout**, passé en `NOT_APPLICABLE` là où le RCA est intégré à la L48. Son statut juridique (décision administrative avec délai de recours propre, ou document informatif) ne change pas ce choix. | Un thread `RCA` par structure et par campagne.                                                                    | Intégrer le RCA au thread `L48`.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| H8.6 | **`CONTRADICTOIRE` est un thread à part.**                                                                                                                                                                                       | Son échéance et son accord tacite lui sont propres.                                                               | En faire une partie de `L48`.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| H9   | **La visibilité de la DREETS et du national sur tous les échanges est acceptée** par les DDETS (réticence exprimée par une DDETS).                                                                                               | Visibilité à 2 valeurs.                                                                                           | Ajouter une règle de lecture par territoire, sans migration.                                                                                                                                                                                                                                                                                                                                                                                                              |
| H10  | **Le volume reste faible** (quelques milliers d'événements par jour au pic).                                                                                                                                                     | Pas de file de tâches en V1.                                                                                      | Passer à pg-boss plus tôt.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| H11  | **Les dépendances externes** (cadre normalisé, atelier gabarits de novembre) **ne concernent que les plugins.**                                                                                                                  | Le socle se livre indépendamment.                                                                                 | Seuls les plugins concernés sont retardés.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| H12  | **Les fichiers ne sont pas confidentiels, seuls les messages le sont.** Les documents finaux sont de toute façon copiés dans les documents financiers, lisibles par tous les agents.                                             | Les fichiers suivent la règle d'accès existante ; leur confidentialité repose sur des clés impossibles à deviner. | Ajouter une règle d'accès par visibilité pour les fichiers (brouillons du fil agents, justificatifs nominatifs).                                                                                                                                                                                                                                                                                                                                                          |

## 3. Vocabulaire

| Terme                 | Définition                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thread**            | Lieu d'échange d'**une** structure, pour **une** année de campagne et **un** type de document réglementaire.                                             |
| **Type de thread**    | L'un des 8 types nationaux. Sa logique (ouverture, fermeture, échéances, plugins) est déclarée en code.                                                  |
| **Année de campagne** | L'exercice tarifé. Ce n'est pas l'année du document : le CA de l'année Y relève de la campagne Y+2.                                                      |
| **Événement**         | Tout ce qui arrive dans un thread : message, dépôt, issue, réouverture, notification… Jamais modifié ni supprimé.                                        |
| **Issue** (`OUTCOME`) | Ce sur quoi débouche un thread : un document validé, un accord tacite à l'échéance, ou une fermeture « sans objet ».                                     |
| **Fil**               | Chaque thread a deux fils : le fil **partagé** (opérateur + agents) et le fil **agents**. Un événement appartient à l'un ou l'autre selon sa visibilité. |
| **Échéance**          | Date réglementaire, qui s'impose soit à l'opérateur, soit à l'État. Affichée, jamais bloquante.                                                          |
| **Plugin**            | Module de code déclaré sur un type de thread, qui réagit à ses événements et peut ajouter de l'UI.                                                       |

## 4. Design

### 4.1 Modèle de données

Esquisse (noms définitifs en PR 1) :

```prisma
model Thread {
  id          Int          @id @default(autoincrement())
  structureId Int          // onDelete: Restrict
  year        Int          // année de campagne
  type        ThreadType
  status      ThreadStatus // cache, écrit uniquement par le service d'ajout d'événement
  @@unique([structureId, year, type])
}

model ThreadEvent {     // ajout seul
  id           Int        @id @default(autoincrement())
  threadId     Int        // onDelete: Restrict
  type         ThreadEventType
  userId       Int?       // auteur ; null = système (cron, plugin)
  authorLevel  AuthorLevel
  visibility   Visibility // ALL | AGENTS
  text         String?
  payload      Json?      // validé par le schéma Zod du type d'événement
  createdAt    DateTime   @default(now()) // horodatage serveur, fait foi
  files        FileUpload[]
}

model ThreadView { threadId Int; userId Int; updatedAt DateTime @updatedAt }

model PluginExecution { eventId Int; pluginKey String; status PluginStatus } // outbox (§ 4.7)

model FileUpload { /* existant */ sha256 String?; threadEventId Int? /* Restrict */ }
```

**Types d'événements** : `MESSAGE` ; cycle de vie (`OPENED`, `OUTCOME`, `TACIT_APPROVAL`, `MARKED_NOT_APPLICABLE`, `REOPENED`) ; informatifs (`SUBMITTED_FOR_REVIEW`, `APPROVED`) ; miroir (`EXTERNAL_DOCUMENT`) ; mails (envoyé, échec) ; `PLUGIN_ERROR` ; et les types propres à chaque plugin.

**Paramètres en base** : la date de la DRL par année, les dates d'ouverture et d'échéance par type × année et la date de mise en service.

**Principes d'intégrité**

- **Ajout seul**, protégé par des triggers PostgreSQL contre les modifications accidentelles (`UPDATE`, `DELETE`, `TRUNCATE`). Une correction est un nouvel événement. Le trigger protège contre les bugs, pas contre un administrateur de la base.
- **L'état d'un thread est un cache** du journal, écrit dans la même transaction que l'événement, et reconstructible.
- **Unicité `(structure, année, type)`** : toute ouverture est idempotente.
- **Transitions d'état atomiques** : deux agents ne peuvent pas poser deux issues en même temps.
- **Aucune cascade** n'atteint un événement ou ses fichiers.

### 4.2 Les 8 types

La logique de chaque type est déclarée dans un registre typé en code, sur le modèle de `ANOMALIE_DEFINITIONS` (éligibilité, ouverture, fermeture, échéances, types suivants, plugins). Règle provisoire : **un document réglementaire = un thread** (H8).

| Type             | Ouverture                            | Issue                                                                                        | Échéance (s'impose à)                          | Copié dans les documents financiers (catégorie) ⚠️  |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `CA`             | Date fixe ⚠️ (avant le 30 avril N-1) | CA (+ rapport d'activité) déposé et reçu                                                     | 30 avril N-1 (opérateur)                       | `COMPTE_ADMINISTRATIF_SOUMIS`, `RAPPORT_ACTIVITE`   |
| `RCA`            | Issue de `CA`                        | RCA signé                                                                                    | ⚠️                                             | `COMPTE_ADMINISTRATIF_RETENU` ⚠️                    |
| `BP`             | Date fixe ⚠️ (ex. 15 juillet N-1)    | BP (+ rapport budgétaire) déposé et reçu ; héberge questions-réponses et dialogue de gestion | 31 octobre N-1 (opérateur)                     | `BUDGET_PREVISIONNEL_DEMANDE`, `RAPPORT_BUDGETAIRE` |
| `L48`            | Publication de la DRL                | L48 signée                                                                                   | J48 (État)                                     | ⚠️                                                  |
| `CONTRADICTOIRE` | Issue de `L48`                       | Réponse de l'opérateur, ou accord tacite à l'échéance                                        | Dernière issue de la L48 + 8 j (opérateur, H1) | —                                                   |
| `DAB`            | Issue de `CONTRADICTOIRE`            | DAB signée                                                                                   | J60 (État)                                     | `BUDGET_PREVISIONNEL_RETENU` ⚠️                     |
| `ARRETE`         | Issue de `DAB`                       | Arrêté signé                                                                                 | —                                              | `ActeAdministratif.ARRETE_TARIFICATION` ⚠️          |
| `PAIEMENT`       | Date fixe ⚠️ (début d'année N)       | Fermeture manuelle ⚠️                                                                        | —                                              | —                                                   |

⚠️ = donnée à fournir par l'équipe métier avant la mise en service : règle d'ouverture (date ? laquelle ?), règle de fermeture et nature de l'issue, échéances et à qui elles s'imposent, éligibilité (quelles structures, quels threads pour les CPOM), catégorie de document financier où le document est copié.

- **`PAIEMENT` est une exception assumée** : il regroupe les documents de paiement, que chaque territoire produit différemment (DAI + avenants + DAM, DAM seule, échéancier régional…). Un thread par pièce réintroduirait une activation par territoire.
- **Éligibilité** (règle nationale par structure) : structures autorisées (CADA, CPH ⚠️) ; CPOM « vrais » : `CA` et `RCA` seulement ⚠️ ; structures subventionnées : aucun thread.
- **Pas d'activation par territoire** (H7) : les différences territoriales s'absorbent en fichiers échangés dans un même thread, ou en `NOT_APPLICABLE` (RCA intégré à la L48 dans certaines DREETS). La forme des documents relève des futurs plugins de génération.

### 4.3 Cycle de vie

| État             | Stocké ? | Sens                                                  |
| ---------------- | -------- | ----------------------------------------------------- |
| `OPEN`           | Oui      | Des échanges sont en cours                            |
| `FINALIZED`      | Oui      | Le thread a débouché sur son issue                    |
| `NOT_APPLICABLE` | Oui      | Fermé sans issue, motif obligatoire                   |
| `EXPECTED`       | **Non**  | Prévu par les règles, pas encore ouvert (calculé)     |
| `LATE`           | **Non**  | Ouvert et échéance dépassée (calculé, dépend du jour) |

- **Tout changement d'état est un événement.** Les états calculés n'en produisent jamais : un événement est un fait, un état calculé une interprétation.
- **Ouverture** : date fixe, date relative à la DRL, issue d'un autre thread, ou manuelle par un agent.
- **Fermeture** : document validé (`OUTCOME`), échéance sans réponse (`TACIT_APPROVAL`, posé automatiquement), ou manuelle (`MARKED_NOT_APPLICABLE`).
- **Réouverture** par un agent, motif obligatoire (L48 modificative, BP corrigé). Le même thread porte les issues successives.
- **Rien ne bloque.** On poste dans tout état, y compris après l'échéance ; un agent peut ouvrir un thread avant que son prédécesseur soit finalisé. Seule règle : un `OUTCOME` exige l'état `OPEN`. Les dépendances entre threads **déclenchent** des ouvertures, elles ne les **conditionnent** pas.

### 4.4 Droits et visibilité

- **Accès à un thread = droit d'édition sur la structure** (`canUpdateStructure`), agents comme opérateurs. Lire et participer relèvent du même droit ; les `LECTEUR` n'ont pas accès.
- **Fermé par défaut.** Les threads ne reprennent **pas** la règle de lecture actuelle de Bhasile, ouverte à tous (`docs/permissions.md`).
- **DREETS et national voient et participent à tout leur périmètre** : c'est un objectif de la feature (H9).
- **Deux fils par thread** : le fil **partagé** (`ALL`) et le fil **agents** (`AGENTS` : brouillons, relectures, échanges DDETS / DREETS). C'est un seul journal ; le fil d'un événement est sa visibilité. Une pièce jointe s'affiche dans le fil de son message, sans règle d'accès propre (H12). Les événements de cycle de vie sont visibles de tous ; mails, relectures et erreurs de plugin relèvent du fil agents.
- **Dépendance au chantier accès opérateur** : `getPrincipal` (`src/app/api/files/file.service.ts`) classe aujourd'hui toute session comme agent pour l'accès aux fichiers. Avec des comptes opérateurs individuels, c'est acceptable en lecture (H12), mais à aligner avec ce chantier.

### 4.5 Fichiers, preuve et conservation

- **Le dépôt et l'issue sont deux faits distincts.** L'opérateur poste son BP (« déposé le 30/10 à 23h41 », fait foi pour le délai) ; l'agent crée ensuite l'`OUTCOME` qui pointe vers ce fichier (« retenu le 04/11 »).
- **Versions = fichiers successifs dans le journal.** Aucun fichier de thread n'est jamais supprimé.
- **Empreinte SHA-256** de chaque fichier, calculée à l'upload.
- **Formats** : ajout de `.docx`, `.odt`, `.pptx` (rapports, brouillons de L48). Limite de 30 Mo inchangée.

**Niveau de preuve** : un **faisceau d'indices**. Journal en ajout seul, horodatage serveur, empreinte du fichier, trace du mail chez un tiers (Brevo), et empreinte du document dans le mail reçu par l'opérateur, une copie hors de notre contrôle. Ce n'est **pas** un horodatage qualifié eIDAS ni un recommandé électronique qualifié ; la valeur juridique est à confirmer (H1 à H3).

**Conservation** : le journal et les pièces sont des **archives publiques** (Code du patrimoine, L211-4) : aucune purge automatique, aucune élimination sans visa. Les pièces peuvent contenir des données nominatives (salariés, demandeurs d'asile). Un tableau de gestion (durées, sort final) et une analyse d'impact (AIPD) sont à établir avec la mission archives du ministère et le DPO, avant la mise en service.

### 4.6 Intégration avec les documents financiers

Les documents financiers existants (`DocumentFinancier`, déposés par les agents via la finalisation, l'actualisation et la modification) restent lus partout : fiche structure, CPOM, actualisation. Le socle s'y articule dans les deux sens, **toujours par copie** :

| Sens                          | Déclencheur                                                              | Effet                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Thread → documents financiers | `OUTCOME` (ou dépôt) dans un thread                                      | Un plugin crée le document financier correspondant, avec sa propre copie du fichier               |
| Documents financiers → thread | Document financier créé, remplacé ou supprimé via un formulaire existant | Événement `EXTERNAL_DOCUMENT` dans le thread, avec copie du fichier (simple trace si suppression) |

- **Pourquoi la copie** : `FileUpload.documentFinancier` est en `onDelete: Cascade`. Si un fichier de thread partageait sa ligne avec un document financier, retirer un document dans l'actualisation effacerait la preuve.
- **Garde-fous** : seuls les documents financiers d'une campagne en cours déclenchent quelque chose (pas les reprises d'historique) ; la suppression d'un document financier est tracée, elle ne rouvre ni ne modifie le thread ; les documents financiers de CPOM et ceux du formulaire d'ajout de structure sont hors miroir.

### 4.7 Plugins

Un plugin est un **module de code**, déclaré par clé dans le registre des types. Un plugin peut réagir aux événements d'un thread, écrire dans ses propres tables (par ex. le registre des montants), et afficher des composants dans des emplacements prévus.

**Contrat**

1. Un plugin ne modifie **jamais** l'état d'un thread directement : il passe par le service d'ajout d'événement.
2. Un plugin ne bloque rien : son verdict (« fichier non conforme au cadre normalisé ») est un événement d'information.
3. L'échec d'un plugin ne casse pas le thread : il devient un événement `PLUGIN_ERROR` visible des agents.
4. Un plugin est **idempotent** : rejoué après une panne, il ne produit pas d'effet en double.

**Exécution** : chaque événement enregistre, **dans la même transaction**, ce que ses plugins doivent traiter (outbox `PluginExecution`). Les plugins s'exécutent juste après, et un cron reprend ce qui n'a pas abouti : un redémarrage du conteneur ne peut pas faire perdre un mail sans bruit. Quand arriveront les plugins lents (extraction, Albert API), **pg-boss** (une file de tâches dans PostgreSQL, écrite dans la même transaction) prendra le relais, sans changer le contrat. Redis est écarté : double écriture, et un composant d'infra de plus sans dev pour le maintenir.

**Plugins livrés par le socle** : la copie vers les documents financiers (§ 4.6) et les mails (§ 4.8).

### 4.8 Mails

- **Le mail est une notification, jamais un contenu** : un lien vers le thread, avec le nom et l'empreinte du document s'il y en a un, mais ni texte ni pièce jointe.
- **Chaque envoi est un événement** (destinataires, identifiant Brevo), dans le fil agents.
- **Les rebonds** (contacts opérateurs partis par exemple) produisent un événement visible des agents, et sont rattrapés par une réconciliation si le webhook échoue.
- **Fournisseur : Brevo transactionnel**, compte existant.
- **Pas de préférences de notification en V1**, pas d'accusé de lecture (H1, H2).

### 4.9 Échéances

- **Uniquement les échéances réglementaires**, nationales. Pas de deadlines internes DREETS : ce sont des règles d'organisation.
- **Chaque échéance indique à qui elle s'impose.** La visibilité s'en déduit : une échéance opérateur (dépôts, 8 jours) est visible par tous ; une échéance État (J48, J60) n'est visible que des agents. C'est ce que demandaient PDL et IdF, qui raccourcissent leurs délais.
- **Jours calendaires, sans report** (H4), comptés en heure de Paris.
- **Les délais opérateur partent de la mise à disposition** (`OUTCOME`), et de la **dernière** en cas de courriers successifs (H1).
- **La DRL est saisie par un admin** chaque année : c'est la seule ancre impossible à connaître d'avance.

### 4.10 Interface

- **Une entrée « Tarification » dans la fiche structure** (section ou onglet, au choix du design) : les 8 threads de l'année de campagne choisie, leurs états, la frise, et chaque thread avec ses deux fils.
- **Un bloc « Tarification » sur le dashboard**, sur le gabarit des blocs existants, filtré comme eux et par année de campagne. L'opérateur a le même bloc sur son propre dashboard, limité à ses structures. Le tableau de bord agrégé DREETS se branchera sur le même service.
- **« Non lu »** via `ThreadView` : un confort, pas une preuve.
- **Laissé au design** : libellés, frise, composition de l'écran de thread et des deux fils, affichage de `NOT_APPLICABLE` (« terminé », pas « manquant ») et des retards.

### 4.11 Mise en service

La campagne 2027 sera à moitié passée hors de Bhasile au lancement : CA 2025, BP 2027, DAI et parfois RCA auront déjà circulé par mail.

- **Un script d'amorçage** crée les threads 2027 déjà « passés » (`CA`, `RCA`, `BP`, `PAIEMENT`) à l'état `OPEN`, avec l'événement « mise en service, étapes antérieures traitées hors Bhasile ». Les documents financiers existants s'y rattachent par le miroir, et le dialogue de gestion 2027 peut se tenir dans `BP`.
- **Une date de mise en service en base** : une échéance antérieure ne déclenche jamais `LATE`.
- **La campagne 2028 démarre normalement.**
- **Mise en service avant le 30 avril 2027** : le premier usage réel sera le dépôt des CA 2026, quelques semaines avant la bascule de la DRL 2027.
- **Dark launch** : tout part en prod au fil des PR ; avant la mise en service, seuls les superadmins voient l'entrée « Tarification » et le bloc dashboard.

## 5. Points d'accroche des briques futures

| Brique future                                          | Se branche sur                                                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Relances avant échéance                                | Plugin mail + états calculés                                                                               |
| Vérification du cadre normalisé au dépôt               | Plugin sur le dépôt dans `CA` / `BP` ; verdict en événement d'information, dans le même thread             |
| Extraction des chiffres                                | Plugin (pg-boss) sur le dépôt ; écrit dans le registre des montants (socle donnée)                         |
| Pré-analyse (écarts N-1, ratios)                       | Plugin de lecture du registre ; résultat dans le fil agents                                                |
| Agent IA (Albert API)                                  | Plugin (pg-boss) ; sorties structurées par compte, dans le fil agents                                      |
| Pré-rédaction RCA / L48, génération DAB / arrêté / DAM | Plugins de génération ; gabarits par territoire (atelier de novembre) ; brouillon posté dans le fil agents |
| Tableau de bord DREETS agrégé                          | Même service que le bloc dashboard                                                                         |
| Consolidation N-1                                      | Socle donnée                                                                                               |
| Pré-remplissage de l'actualisation                     | Les documents financiers copiés par les threads                                                            |

**Pour la data** : le contrat de plugin (§ 4.7) est l'interface entre ce socle et le socle donnée. Un plugin d'extraction lit le fichier d'un événement, écrit dans le registre, et publie son verdict en événement. Il n'a besoin d'aucune autre prise.
