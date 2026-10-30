# Tarification

La campagne de tarification d'une structure dans Bhasile : les documents échangés entre l'opérateur, la DDETS et la DREETS (CA, BP, RCA, L48, DAB, arrêté…), leurs étapes, leurs échéances et la procédure contradictoire. Elle remplace les envois par mail, garde l'historique et fait preuve.

La tarification s'appuie sur la [messagerie](messagerie.md) : les échanges vivent dans un panneau à part, la tarification leur fournit les tags et les ancres. La dépendance va dans un seul sens : la tarification importe la messagerie, jamais l'inverse. Elle partage aussi son [socle commun](messagerie.md#socle-commun) (ajout seul, fichiers, preuve, conservation, mise en prod) et le mécanisme des [emails](email.md).

Les décisions et leurs alternatives écartées sont dans l'[ancienne RFC](rfc/campagne-tarification/rfc-01-socle-messagerie.md), conservée pour l'historique, et dans le grill du 30/10. Les décisions marquées ⏳ attendent la confirmation de l'équipe (envoyées le 30/10) : elles sont appliquées en attendant.

## Vocabulaire

| Terme                       | Dans le code                    | Définition                                                                                                                        |
| --------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Campagne**                | `TarificationCampaign`          | La campagne nationale d'une année N : elle fixe le tarif N à partir du CA N-2 et du BP N.                                         |
| **Tarification**            | `StructureTarification`         | Une structure dans une campagne. Porte ses documents, son journal et ses deux conversations.                                      |
| **Étape**                   | `TarificationStepCode`          | Un moment de la procédure (RCA, L48, DAB, Arrêté), défini en code. Son état se calcule, rien n'est stocké.                        |
| **Document**                | `TarificationDocument`          | Une version déposée : un fichier, un ou plusieurs types, un état. Une nouvelle version est un nouveau document.                   |
| **Événement**               | `TarificationEvent`             | Un fait du journal de la tarification (dépôt, partage, validation, retrait, sans objet, réponse au contradictoire, hors Bhasile). |
| **Partage**                 | `DOCUMENT_SHARED`               | L'envoi d'un document des agents à l'opérateur. C'est la mise à disposition.                                                      |
| **Relecture**               | `APPROVED`, `CHANGES_REQUESTED` | Validation d'une version de travail, ou demande de modifications, par un autre agent que son auteur.                              |
| **Ouverture**               | `TarificationDocumentOpening`   | La première fois qu'un fichier partagé est servi à un utilisateur de l'opérateur. Celle de la L48 fait courir le contradictoire.  |
| **Sans objet**              | `STEP_MARKED_NOT_APPLICABLE`    | Une étape déclarée sans objet par un agent, avec un motif (CA jamais reçu, RCA intégré à la L48…).                                |
| **Hors Bhasile**            | `OUT_OF_BHASILE_DECLARED`       | Une tarification menée hors de l'outil, déclarée par un agent avec un motif.                                                      |
| **Échéance**                | registre des étapes             | Une date réglementaire, calculée.                                                                                                 |
| **Exercice**                | —                               | L'année que couvre un document, déduite de son type et de la campagne (le CA de la campagne N est le CA N-2).                     |
| **Documents préparatoires** | —                               | Ce que l'écran rappelle en tête de la campagne : DRL, CA et rapport d'activité, BP et rapport budgétaire, DAI N.                  |

## Contexte

La tarification d'une structure autorisée suit le calendrier du CASF :

| Quand                       | Quoi                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| 30 avril N-1                | L'opérateur dépose le CA N-2, avec le rapport d'activité.                                           |
| 31 octobre N-1              | L'opérateur dépose le BP N, avec le rapport budgétaire.                                             |
| Publication de la DRL       | Point de départ des délais de l'État.                                                               |
| J48                         | La L48 (propositions de modification du BP) parvient à l'opérateur ; le RCA au plus tard avec elle. |
| 8 jours après son ouverture | L'opérateur accepte ou conteste la L48 (procédure contradictoire).                                  |
| J60                         | La DAB (dite aussi L60) fixe le budget.                                                             |
| Ensuite                     | L'arrêté de tarification, puis selon les cas DAM, DAI, échéanciers.                                 |

Deux campagnes sont donc toujours en cours : en 2027, la campagne 2027 (L48, DAB, arrêté) et la campagne 2028 (dépôt du CA 2026 et du BP 2028). Aujourd'hui, tout passe par mail.

**Hors périmètre** :

- **la signature** : elle se fait hors de Bhasile, parfois par le préfet ; on dépose le scan signé ;
- **les paiements** (Chorus) : Bhasile ne les voit pas, il ne les suit donc pas ;
- **les circuits de validation internes** : pas de rôle « valideur », les agents se connaissent ;
- **les montants** : pas de registre des montants, ni d'extraction ;
- **la génération des documents** et les plugins : après la V1 (voir [Évolutions possibles](#évolutions-possibles)) ;
- **le ROB**, document régional.

## Modèle de données

Le schéma vit dans [`tarification.prisma`](../prisma/schema/tarification.prisma).

```
TarificationCampaign 1─N StructureTarification 1─N TarificationDocument 1─1 FileUpload
                           │                           └─ TarificationDocumentOpening (ouvert, par utilisateur)
                           ├─ TarificationEvent ──→ TarificationDocument (documentId, facultatif)
                           └─ Conversation (messagerie, une par canal)
```

- **`TarificationCampaign`** porte la DRL de l'année : date de publication et lien Légifrance, saisis directement en base par un dev pour 2027.
- **`TarificationDocument`** est une version déposée : un seul fichier, ses types, son état choisi au dépôt. Il ne change jamais.
- **`TarificationEvent`** est le journal, en ajout seul. Trois colonnes facultatives suffisent à tous les types : le document visé, l'étape visée (pour le « sans objet »), un texte (motif, observations, modifications demandées). Le registre des types d'événements dit, pour chaque type, lesquelles sont obligatoires, s'il notifie et qui le voit ; une fonction pure le vérifie.
- **Pas de table d'étapes** : l'étape d'un document se déduit de ses types. Une table d'étapes n'aurait aucune donnée propre, et un document à plusieurs types compte pour plusieurs étapes.
- **Pas de `payload` JSON** tant qu'il n'y a pas de plugin : les références sont des clés étrangères (`Restrict`).
- **La date d'un fait est celle de son événement** (`TarificationEvent.createdAt`, horodatage serveur), écrit dans la même transaction que le document ; `TarificationDocument` n'a pas de date propre qui pourrait la contredire.
- **`FileUpload.sha256`** : l'empreinte, calculée dans `POST /api/files`, où le fichier est déjà en mémoire.
- **`sourceTarificationDocumentId`** sur `DocumentFinancier` et `ActeAdministratif` : identifie une copie faite par la tarification (voir [Fiche structure](#fiche-structure)).

## Campagnes et éligibilité

- **Une campagne N est ouverte du 1er janvier N-1 au 31 décembre N**, puis en lecture seule. C'est un calcul sur la date civile locale de la structure (voir Échéances), sans cron, partagé avec la messagerie : `getCampaignPhase(year, now, timeZone)` renvoie `UPCOMING` (pas encore ouverte), `OPEN` ou `CATCH_UP` (rattrapage, sans limite de durée), et remplacera `assertCampaignOpen`, binaire. Le calcul de « maintenant » suit la PR transverse sur `CURRENT_YEAR` (calcul par requête, heure de Paris).
- **Clôture automatique**, sans bouton : une clôture manuelle ne serait jamais faite, et multiplierait les campagnes ouvertes.
- **Rattrapage après le 31 décembre N** ⏳ : un agent peut encore déposer et partager un arrêté, une DAM, une DAI ou un échéancier dans la campagne N (arrêté tardif). Tout le reste est fermé : messages, dépôts de l'opérateur, relecture. Sans limite de durée. Le sélecteur de campagne propose donc aussi, aux agents, les campagnes en rattrapage même sans tarification.
- **Éligibilité** ⏳ : seuls les CADA et les CPH ont une tarification (`isStructureAutorisee`). Une structure ne change jamais de type : une transformation ferme une structure et en ouvre une autre, qui a sa propre tarification. La garde est une règle de domaine dans le service (et non un droit CASL), appliquée aussi à la messagerie. Une tarification existante reste consultable si la structure ferme.
- **Création à la volée** : la campagne et la tarification sont créées au premier dépôt ou au premier message (création idempotente sur leurs clés uniques). Une campagne sans document ni message n'existe qu'à l'écran.
- **Hors Bhasile** : un agent déclare qu'une tarification est menée hors de l'outil (motif obligatoire), par exemple pour un opérateur qu'une DDETS garde hors de Bhasile. Plus aucune étape n'est en retard, un bandeau l'affiche, et les dépôts restent possibles. La déclaration vaut pour une campagne et ne s'annule pas.

## Documents

**Types** (liste fermée, `TarificationDocumentType`, pour ne pas croiser le type `DocumentType` du DOM)

| Type                     | Déposé par | Exercice | Étape  |
| ------------------------ | ---------- | -------- | ------ |
| `CA`                     | opérateur  | N-2      | —      |
| `RAPPORT_ACTIVITE`       | opérateur  | N-2      | —      |
| `BP`                     | opérateur  | N        | —      |
| `RAPPORT_BUDGETAIRE`     | opérateur  | N        | —      |
| `RCA`                    | agents     | N-2      | RCA    |
| `L48`                    | agents     | N        | L48    |
| `REPONSE_CONTRADICTOIRE` | opérateur  | N        | L48    |
| `DAB`                    | agents     | N        | DAB    |
| `ARRETE`                 | agents     | N        | ARRETE |
| `DAM`                    | agents     | N        | ARRETE |
| `ECHEANCIER`             | agents     | N        | ARRETE |
| `DAI`                    | agents     | N+1      | ARRETE |
| `PIECE_JUSTIFICATIVE`    | tous       | N        | —      |
| `AUTRE`                  | tous       | N        | —      |

⏳ Si la L60 est un document distinct de la DAB (Paris), un type `L60` s'ajoute à l'étape DAB, qui reste faite au partage de la DAB.

**Règles**

- **Un document = un fichier**, comme sur la fiche aujourd'hui : l'opérateur regroupe ses annexes dans un seul PDF.
- **Un document peut porter plusieurs types** (une L48 qui contient le RCA) : il compte pour toutes leurs étapes.
- **L'écran ne propose que les types pertinents** pour l'émetteur et le moment de la campagne.
- **L'exercice se déduit** du type et de la campagne, l'écran l'affiche en toutes lettres (« DAI 2028 »).
- **Empreinte SHA-256** calculée à l'upload (`FileUpload.sha256`), affichée et reprise dans les mails.

**États**, choisis au dépôt et jamais modifiés :

| État     | Sens                                    | Qui le voit         |
| -------- | --------------------------------------- | ------------------- |
| `DRAFT`  | version de travail des agents, à relire | agents              |
| `FINAL`  | version signée, pas encore partagée     | agents              |
| `SHARED` | dépôt de l'opérateur, partagé d'office  | agents et opérateur |

- **Documents de l'opérateur** ⏳ : la campagne est le seul point d'entrée du CA, du BP et de leurs rapports, qui ne se déposent plus sur la fiche (voir [Fiche structure](#fiche-structure)). Les opérateurs ont un compte dès la mise en service. Un agent qui reçoit malgré tout un document par mail le dépose à la place de l'opérateur ; c'est la date du dépôt qui compte.
- **Documents des agents** ⏳ : une version se dépose en `DRAFT`, ou en `FINAL` en cochant « c'est la version signée ».
  - **Relecture** : sur un `DRAFT`, tout agent éditeur sauf son auteur peut **valider** ou **demander des modifications** (avec un texte). Une validation suffit. Tout `DRAFT` est à relire : il n'y a pas de demande de relecture, on sollicite un collègue par un message dans le canal agents.
  - **Partage** : « Envoyer à l'opérateur » n'existe que pour un `FINAL`. La validation n'est pas exigée (rien ne bloque), l'écran affiche « non validé ».
  - **État affiché**, calculé à partir du journal : créé, validé ou modifications demandées, signé, envoyé.
- **Retrait** : un agent retire un document partagé par erreur (`DOCUMENT_WITHDRAWN`, motif obligatoire). Il sort des états, de l'ancre du contradictoire et de la copie vers la fiche (retour à la copie précédente) ; l'opérateur voit « retiré le … » et ne peut plus ouvrir le fichier ; rien n'est effacé. Une erreur de structure se corrige ainsi, l'agent prévient l'opérateur.
- **Qui a fait quoi** : chaque fait d'un document s'affiche avec son auteur et sa date, tirés du journal. On sait qui a déposé la version signée, pas qui a signé.

## Étapes

Les étapes sont définies dans un registre typé en code, `TARIFICATION_STEP_DEFINITIONS`, sur le modèle de `ANOMALIE_DEFINITIONS`. Leur état se calcule à partir du journal.

| Étape    | Faite quand…               | S'ouvre quand…                                     |
| -------- | -------------------------- | -------------------------------------------------- |
| `RCA`    | un `RCA` est partagé       | le CA est déposé                                   |
| `L48`    | une `L48` est partagée     | le RCA est fait ou sans objet, et le BP est déposé |
| `DAB`    | une `DAB` est partagée     | la L48 est faite ou sans objet                     |
| `ARRETE` | un `ARRETE` est partagé ⏳ | la DAB est faite ou sans objet                     |

- **Une seule étape en cours** : la première, dans l'ordre, qui n'est ni faite ni sans objet. L'ordre sert aussi de frise et de phases pour les tags de la messagerie.
- **Priorité des états** : faite > sans objet > en attente / à venir. Un document qui arrive après un « sans objet » l'emporte.
- **Rien ne bloque l'écriture**, sauf deux gardes au partage : on ne partage qu'un `FINAL`, et **pas de L48 sans BP déposé**.
- **Sans objet** ⏳ : un agent déclare une étape sans objet, avec un motif (CA jamais reçu, BP jamais reçu, RCA intégré à la L48, pratique du territoire sous CPOM). Pas d'annulation : si le document finit par arriver, son partage fait l'étape.
- **Étape `ARRETE`** ⏳ : faite au partage de l'arrêté. Le paiement n'est pas suivi. DAM, DAI et échéanciers s'y rattachent, en autant d'exemplaires que nécessaire (transformations en cours d'année), sans changer son état.

## Échéances et retards

| Échéance         | Point de départ                             | S'impose à |
| ---------------- | ------------------------------------------- | ---------- |
| Dépôt du CA      | date fixe : 30 avril N-1                    | opérateur  |
| Dépôt du BP      | date fixe : 31 octobre N-1                  | opérateur  |
| RCA              | J48 depuis la DRL, au plus tard avec la L48 | État       |
| L48              | J48 depuis la DRL (mesuré au partage)       | État       |
| Réponse à la L48 | 8 jours après la première ouverture         | opérateur  |
| DAB              | J60 depuis la DRL                           | État       |

- **Uniquement les échéances réglementaires**, nationales, calculées. Les calendriers internes des DREETS n'en sont pas.
- **Jours calendaires, sans report** ; le jour de l'événement ne compte pas (J1 est le lendemain).
- **Heure du département de la structure**, pas celle de l'utilisateur : un délai se compte à l'heure de la DDETS qui reçoit, et l'état doit être le même pour tous, y compris côté serveur (notifications, tableau de bord) où il n'y a pas d'utilisateur. Le fuseau se déduit de `Structure.departementAdministratif` (`getDepartementTimeZone`) : Europe/Paris, sauf les cinq DROM.
- **Dates civiles** : une échéance est une date locale (la DRL en `@db.Date`), pas un instant. Une étape est en retard quand la date locale du jour dépasse l'échéance ; une réponse est acceptée tant que sa date locale ne la dépasse pas. Tests au 31/12 à 23 h 30, aux changements d'heure et outre-mer.
- **DRL non saisie** : pas d'échéance J48 ni J60, et donc pas de retard, tant que la date n'est pas en base.
- **Toutes les échéances sont visibles de tous**, opérateur compris : la date de la DRL est publique.
- **Retard** : un badge sur l'étape et un filtre au tableau de bord, pas le moteur d'anomalies. Une étape est en retard si son échéance est passée sans qu'elle soit faite ou sans objet ; un dépôt du CA ou du BP, s'il arrive après sa date.
- **Jamais en retard** : une structure couverte par un CPOM pendant l'année de la campagne (fonction à écrire : les deux logiques actuelles de « CPOM courant » se fondent sur la date du jour), une tarification hors Bhasile, un dépôt repris par le script d'amorçage.

## Contradictoire

- **Un seul contradictoire par tarification**, ancré sur la première L48 partagée et non retirée. Une L48 partagée ensuite reste visible mais ne relance pas le délai ; l'agent en est averti (les corrections passent par la DAB).
- **Le délai court à partir de la première ouverture** de la L48 par un utilisateur de l'opérateur : 8 jours, J1 étant le lendemain. Si elle n'est pas ouverte dans les 15 jours, elle est réputée reçue à la date de son partage (repli du CRPA, avis juridique attendu). Entre le partage et la première ouverture, l'échéance n'est pas encore fixée : l'état est « en attente d'ouverture », jusqu'à l'ouverture ou jusqu'au 15e jour.
- **Ouverture** : un lien signé vers le fichier délivré à un utilisateur de l'opérateur, pour la visionneuse ou le téléchargement (l'application ne sert pas le fichier, elle renvoie une URL S3 présignée). L'ouverture est enregistrée **avant** de renvoyer l'URL : si l'écriture échoue, pas d'URL. Le lien d'un document de tarification a une durée de validité courte, pour qu'un document retiré ne reste pas ouvrable. L'affichage de la page, de la liste ou du mail ne compte pas (un antivirus de messagerie ouvre les liens tout seul) : seul compte un lien demandé par une session, au clic. Les agents et les superadmins n'ouvrent jamais au sens du délai. Les ouvertures de tous les documents partagés sont enregistrées et affichées (« ouvert le … par … »).
- **Réponse** : l'opérateur accepte ou conteste (`L48_ACCEPTED`, `L48_CONTESTED`, observations et document `REPONSE_CONTRADICTOIRE` facultatifs). Plusieurs réponses sont possibles jusqu'à l'échéance, la dernière compte ; aucune après.
- **Réputé accepté** : calculé, à l'échéance, sans réponse.
- **La contestation se fait dans Bhasile** ⏳. Il n'y a pas de saisie par un agent d'une contestation reçue par courrier ; ce cas se signale par un message.

## Fiche structure

- **Copie à sens unique, de la tarification vers la fiche** ⏳ : le dépôt d'un document de l'opérateur, ou le partage d'un document des agents, en copie le fichier sur la fiche (nouvel objet S3, la fiche ne référence pas le fichier de la tarification). La copie suit le dernier document non retiré de chaque type, et porte `sourceTarificationDocumentId` : c'est ce qui la reconnaît comme copie.

  | Type                 | Sur la fiche                                                                         |
  | -------------------- | ------------------------------------------------------------------------------------ |
  | `CA`                 | `COMPTE_ADMINISTRATIF_SOUMIS`                                                        |
  | `RCA`                | `COMPTE_ADMINISTRATIF_RETENU`                                                        |
  | `RAPPORT_ACTIVITE`   | `RAPPORT_ACTIVITE`                                                                   |
  | `BP`                 | `BUDGET_PREVISIONNEL_DEMANDE`                                                        |
  | `DAB`                | `BUDGET_PREVISIONNEL_RETENU`                                                         |
  | `RAPPORT_BUDGETAIRE` | `RAPPORT_BUDGETAIRE`                                                                 |
  | `ARRETE`             | acte administratif `ARRETE_TARIFICATION`, période du 1er janvier au 31 décembre N ⏳ |

  L48, réponse au contradictoire, DAM ⏳, DAI, échéancier et pièces n'ont pas d'équivalent sur la fiche. Un document à plusieurs types donne une copie par type. La copie va toujours sur la structure, même si la fiche porte des documents du CPOM (`cpomId`), qui ne sont pas touchés.

- **Une copie est verrouillée** : la présence de `sourceTarificationDocumentId` suffit, quels que soient la catégorie et l'année. Les deux repositories l'excluent de leurs suppressions et ignorent toute modification qui la vise (`createOrUpdateDocumentsFinanciers` supprime aujourd'hui les documents absents du formulaire et réécrit catégorie et année ; les actes administratifs ont le même chemin) ; `canDeleteFile` refuse la suppression de son fichier. Les lignes saisies à la main restent modifiables, y compris pour les années couvertes.
- **Réconciliation** : `syncFicheCopies(structureTarificationId)`, idempotente, appelée après chaque dépôt, partage ou retrait. Elle calcule l'état voulu depuis le journal (dernier document non retiré par type), fait les copies S3 hors transaction (un objet orphelin en cas d'échec est accepté), puis écrit la fiche sous verrou de la tarification (`SELECT … FOR UPDATE`). Rejouée, elle ne fait rien ; un retrait la fait revenir à la copie précédente.
- **Script de reprise** : la mise en service a lieu avant la campagne 2027 ; un script reprend dans la tarification les CA 2025, rapports d'activité 2025, BP 2027 et rapports budgétaires 2027 déjà sur la fiche, comme des dépôts ordinaires écrits par le système, sans notification ni retard. Il **relie** la ligne existante de la fiche (`sourceTarificationDocumentId`) au lieu d'en créer une copie ; s'il y a plusieurs lignes pour une même catégorie et une même année, il prend la plus récente. Rejouable sans doublon.

## Droits et visibilité

- **Accès** : celui de la messagerie (`canAccessTarification` : droit d'édition sur la structure, hors grants `NATIONAL`, porte `MESSAGERIE_ENABLED`). Voir [Droits et visibilité de la messagerie](messagerie.md#droits-et-visibilité).
- **Ce que voit l'opérateur**, calculé (une colonne ne suivrait pas un document qui devient visible au partage) :

  | Quoi         | Règle                                                                                                                                                                               |
  | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Un document  | déposé par l'opérateur, ou visé par un partage ; son fichier ne s'ouvre plus une fois retiré                                                                                        |
  | Un événement | selon son type, dans le registre : partage, retrait, sans objet, hors Bhasile, réponse au contradictoire, ses dépôts → visibles ; versions des agents, relecture → agents seulement |
  | Les dates    | celles des seuls événements qu'il voit : jamais quand la L48 a été rédigée ou validée                                                                                               |

- **Un seul point de passage pour lire le journal** : `getTarificationJournal(structureTarificationId, reader)`, utilisé par la page, l'API et les mails. Aucune lecture du journal ne le contourne.
- **Un seul point de passage pour les fichiers** : `/api/files` appelle `canOpenTarificationDocument` (avant la règle générale qui laisse tout agent lire un fichier rattaché), et enregistre l'ouverture au même endroit, au moment de délivrer le lien.
- **Superadmins** : lecture seule ; leurs lectures n'ouvrent rien au sens du délai.

## Notifications

Le mécanisme est celui des [emails](email.md) : un seul mail par destinataire et par passage (deux par jour), avec deux sections, messages et documents. Aucun délai ne dépend du mail : le contradictoire court depuis l'ouverture, un dépôt est daté par le serveur. Ici, la politique ⏳ :

| Fait                                                                         | Destinataires                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Message                                                                      | voir [Notifications de la messagerie](messagerie.md#notifications)     |
| Dépôt de l'opérateur (CA, BP, rapports, réponse, pièce)                      | agents éditeurs de la DDETS                                            |
| Accusé de dépôt                                                              | l'auteur du dépôt : type, date et empreinte, sa preuve hors de Bhasile |
| Partage d'un document à l'opérateur                                          | l'opérateur, avec le type, l'exercice et l'empreinte du document       |
| Validation ou modifications demandées                                        | l'auteur de la version                                                 |
| Contestation de la L48                                                       | les agents éditeurs de la DDETS **et de la DREETS**                    |
| Retrait d'un document                                                        | ceux qui avaient reçu le mail de son partage                           |
| Version déposée par un agent, acceptation, sans objet, hors Bhasile, reprise | personne                                                               |

- **Liste blanche** : chaque type d'événement déclare dans le registre s'il notifie ; un nouveau type ne notifie pas par défaut.
- **La DREETS n'est notifiée que des contestations** : c'est le seul fait qui attend une action de sa part.
- **Jamais le nom du fichier** dans un mail (un mail est une notification, pas un contenu, voir [Emails](email.md#principes)) : « L48 2027 » et l'empreinte.
- **Trace** : `TarificationEventNotification` (l'événement est traité, ou abandonné) et `TarificationEventNotificationRecipient` (signalé à un destinataire, avec le `brevoMessageId`), sur le modèle de la messagerie. Le mail groupé lit l'union des messages et des événements en attente, avec un template à deux sections.
- **Destinataires** : une fonction propre à la tarification ; celle de la messagerie (`getMessageRecipients`) exclut les grants `REGION`, alors que la contestation vise la DREETS.
- **Déjà vu** : un partage ouvert avant le passage du cron n'est pas signalé ; un accusé de dépôt l'est toujours. Un partage retiré avant le passage n'est pas signalé (le mail annoncerait un document retiré).
- **Les opérateurs** ont un compte dès la mise en service : les rebonds redeviennent utiles (contacts partis), le webhook Brevo est donc un prérequis de la mise en service.

## Interface

À préciser avec les maquettes (fin novembre).

- **Page** `/structures/[id]/tarification/[year]`, celle de la messagerie, qui passe en panneau à part.
- **Navigation par documents** à gauche, avec la progression des étapes ; à droite, un panneau selon l'état du document sélectionné (relecture, envoi, réponse au contradictoire…). Les délais en cours sont affichés.
- **Documents préparatoires** ⏳ : DRL (lien Légifrance), CA et rapport d'activité, BP et rapport budgétaire, DAI N (partagée dans la campagne précédente). Pas de ROB en V1.
- **Visionneuse et téléchargement** : le fichier n'est chargé qu'au clic, jamais à l'affichage de la page, pour ne pas compter de fausse ouverture.
- **À l'écran** : « créé », « validé », « signé », « envoyé », jamais « brouillon ».
- **Tableau de bord** : un bloc « Tarification », sur le gabarit des blocs existants, filtré comme eux et par campagne (étapes en cours, retards, non-lus de la messagerie). L'opérateur a le même bloc, limité à ses structures.

## Mise en service

- **Avant la campagne 2027**, et donc avant le dépôt du CA 2026 : la campagne 2027 suit les mêmes règles que les suivantes, seuls le CA 2025 et le BP 2027 sont repris de la fiche.
- **Porte** : `MESSAGERIE_ENABLED`, qui ferme déjà toute la page tarification (voir [Mise en prod](messagerie.md#socle-commun)).
- **DRL 2027** saisie en base par un dev.
- **Prérequis** : les comptes opérateurs (en place bien avant), le webhook des rebonds.

## Implémentation

| Brique                                     | Où                                                                                                                                                                                                                                   | État                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| Doc, modèle, registres, règles calculées   | `docs/tarification.md`, `prisma/schema/tarification.prisma`, `src/lib/tarification/` (registres `tarification.definition.ts`, calcul `tarification.compute.ts`, visibilité, forme des événements, phase de campagne, dates locales) | en cours (`tarification-modele`) |
| Écritures, gardes, journal, fichiers       | `tarification-api`                                                                                                                                                                                                                   | à faire                          |
| Copie vers la fiche, verrouillage, reprise | `tarification-fiche`                                                                                                                                                                                                                 | à faire                          |
| Notifications                              | mail groupé à plusieurs sources (`tarification-notifications`)                                                                                                                                                                       | à faire                          |
| Interface                                  | `tarification-ui`, après les maquettes                                                                                                                                                                                               | à faire                          |
| Tableau de bord, suivi d'une structure     | `tarification-dashboard`, `StructureSubscription`                                                                                                                                                                                    | à faire                          |

T1 met aussi à jour l'ordre de `prisma/utils/wipe.ts`, les seeders, `isOrphan` et `fileWithParentsInclude` (fichiers rattachés à un document de tarification) et les types de `src/types/`.

Les tags de la messagerie s'alignent sur les codes d'étape : `ARRETE_PAIEMENT` devient `ARRETE` (« Arrêté »), sans reprise de données tant que la messagerie n'est pas ouverte.

## Questions ouvertes

- **Juriste** : repli de 15 jours si la L48 n'est jamais ouverte (CRPA, applicable aux associations ?) ; J48 mesuré à la mise à disposition plutôt qu'à l'ouverture ; délai de recours de la DAB et de l'arrêté (les ouvertures de tous les documents sont déjà enregistrées).
- **Équipe** : les décisions marquées ⏳.
- **Relances** (rappels d'échéance) : en attente des règles de Lucas ; elles réutiliseront le mail groupé.

## Évolutions possibles

| Évolution                                                             | Comment                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Génération des documents (gabarits, données requises, édition)        | Plugins : colonne `payload` sur les événements, brouillon dans les tables du générateur. |
| ROB et calendrier régional                                            | Document régional (région × campagne), déposé par la DREETS.                             |
| Date de réception déclarée (document reçu par mail, déposé plus tard) | Colonne `receivedAt` nullable sur le document, utilisée pour les retards.                |
| Document en plusieurs fichiers                                        | Le document devient un agrégat de fichiers ; la copie vers la fiche suit.                |
| Annuler un « sans objet »                                             | Événement de compensation, si l'affichage erroné devient gênant.                         |
| Tableau de bord agrégé DREETS                                         | Branché sur le service du bloc tarification.                                             |
| Tarification sous CPOM (rattachée au CPOM plutôt qu'à la structure)   | Deux colonnes exclusives sur `StructureTarification`.                                    |
