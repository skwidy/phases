# Phases — spécification produit et technique (v1.0)

Source de vérité pour coder l'app. En cas de doute entre ce fichier et un écran de `design/`, ce fichier gagne sur la logique, l'écran gagne sur le visuel.

## 1. Le produit en une phrase

App iPhone gratuite, 100 % locale, qui suit le cycle menstruel de sa partenaire (ou le sien) et prévient la veille du SPM et des règles, avec pour chaque phase « ce qui se passe » et « ce que tu peux faire ».

Signature : « Ce genre de chose devrait être gratuit. Et privé. » (EN : "Some things should be free. And private.")

## 2. Principes non négociables

1. **Rien ne quitte le téléphone.** Aucune requête réseau dans le code applicatif. Aucun SDK tiers de tracking, analytics, crash reporting, pub (pas de Sentry, Firebase, Amplitude…). Pas de compte.
2. **Gratuit, tout.** Pas d'achat intégré, pas de paywall.
3. **3 rappels par cycle max** (+1 optionnel désactivé par défaut). Pas de badge, pas de relance « ouvre l'app ».
4. **Une seule saisie récurrente** : confirmer le début des règles (bouton ou action de notification).
5. **Honnête sur l'incertitude** : toujours « probable », fenêtres quand c'est variable. Jamais médical, jamais contraceptif.
6. **Respect** : on décrit ce qu'elle peut ressentir et ce qui aide. Jamais « gérer son humeur », jamais « c'est les hormones ».
7. **FR et EN** dès la v1, tous les textes dans `src/i18n/*.json` et `src/content/*.json`, aucun texte en dur.

## 3. Modes et personas

- `mode: 'partner'` (défaut) : l'utilisateur suit le cycle de sa partenaire. Textes à la 3e personne (« elle », « ses règles »). Prénom optionnel `partnerName`, utilisé dans les textes quand il existe.
- `mode: 'self'` : l'utilisatrice suit son propre cycle. Textes à la 2e personne (« tu », « tes règles »).

Toutes les chaînes qui dépendent du mode ont deux clés : `*_partner` et `*_self`.

## 4. Modèle du cycle

Entrées : date du dernier J1 (premier jour des règles), durée du cycle `L`, durée des règles `P`.

Ovulation estimée `O = L − 14` (la phase lutéale varie peu ; l'estimation n'est jamais présentée comme fiable).

| Phase | Clé | Début | Fin | Exemple L=28, P=5 |
| --- | --- | --- | --- | --- |
| Règles | `regles` | J1 | JP | J1–J5 |
| Folliculaire | `folliculaire` | J(P+1) | J(O−2) | J6–J12 |
| Ovulation | `ovulation` | J(O−1) | J(O+1) | J13–J15 |
| Lutéale | `luteale` | J(O+2) | JL | J16–J28 |
| SPM (sous-phase, prioritaire à l'affichage) | `spm` | J(L−6) | JL | J22–J28 |
| Retard | `retard` | J(L+1) | … | J29+ sans confirmation |

**Prédiction de L** : médiane des 6 derniers cycles complets dont la durée est entre 21 et 45 jours. Sans cycle complet : `defaults.cycleLength` (saisi à l'onboarding, sinon 28). `P` : médiane des `periodLength` saisis, sinon `defaults.periodLength` (5).

**Incertitude** : écart-type σ des cycles retenus, calculé dès 3 cycles.
- σ ≤ 2 : dates simples.
- 2 < σ ≤ 5 : fenêtre affichée (« règles entre le 12 et le 16 »), rappels calés sur le début de la fenêtre (date prédite − ⌈σ⌉).
- σ > 5 : `irregular = true`, bandeau « Cycle irrégulier », rappels gardés mais formulés « possible ».

**Retard** : `late = jourDuCycle − L − 1` (0 le jour prévu, 2 deux jours après). L'accueil affiche « Règles attendues · J+N ». Aucune interprétation médicale.

**Confirmation** : `startCycle(date)` crée un nouveau cycle à cette date (modifiable ± 7 jours autour d'aujourd'hui, jamais dans le futur), recalcule tout et reprogramme les rappels. Deux débuts à moins de 5 jours = même cycle (on garde le plus récent saisi).

**Dates** : toujours des jours calendaires locaux `YYYY-MM-DD`. Jamais de timestamps pour la logique. L'implémentation de référence est `apps/web/assets/sync.js` (fonctions `dayNumber`, `status`, `predictCycleLength`, `phasesFor`), testée par `tests/sync.test.mjs`. Le moteur TypeScript de l'app doit donner exactement les mêmes résultats sur les mêmes entrées.

## 5. Données et stockage

```ts
type ISODate = string; // 'YYYY-MM-DD', jour local

interface AppState {
  version: 1;
  mode: 'partner' | 'self';
  partnerName?: string;
  language: 'auto' | 'fr' | 'en';
  cycles: { start: ISODate; periodLength?: number }[]; // triés par date croissante
  defaults: { cycleLength: number; periodLength: number }; // 28 / 5
  reminders: {
    pms: boolean;        // défaut true
    period: boolean;     // défaut true
    confirm: boolean;    // défaut true
    ovulation: boolean;  // défaut false
    eveningTime: string; // '19:00'
    morningTime: string; // '09:00'
    discreet: boolean;   // défaut false
  };
  security: { faceId: boolean }; // défaut false
  onboarded: boolean;
}
```

- Zustand + `persist` sur `expo-sqlite/kv-store`. Une seule clé `phases-state`. Migration via `version`.
- Tout le reste (phase du jour, prochaines dates, rappels) est dérivé par des fonctions pures, jamais stocké.
- **Export** : `phases-backup-AAAA-MM-JJ.json` via la feuille de partage (`expo-sharing`). **Import** : `expo-document-picker`, validation du schéma, confirmation, remplacement.
- **Tout effacer** : remet l'état initial, annule toutes les notifications, renvoie à l'onboarding.

## 6. Rappels (le cœur du produit)

Notifications **locales** (`expo-notifications`, trigger `date`). Aucune notification push.

| # | Clé | Quand | Titre | Texte partenaire | Texte self | Actions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `pms` | Veille du 1er jour SPM, heure du soir | SPM demain, probablement | Les 7 prochains jours peuvent être plus durs pour elle. Moins de débats, plus de douceur. | Ton SPM commence probablement demain. Allège ton agenda si tu peux. | — |
| 2 | `period` | Veille du J1 prévu, heure du soir | Règles attendues demain | Bouillotte, antidouleurs dans la pharmacie, soirée calme. Tu confirmeras demain. | Pense à avoir ce qu'il faut sur toi demain. | — |
| 3 | `confirm` | J1 prévu, heure du matin, puis J+1, J+2, J+3 | Ça a commencé ? / Tes règles ont commencé ? | Un tap pour recaler les prochaines dates. | idem | « Oui, aujourd'hui » · « Pas encore » |
| 4 | `ovulation` (off) | Veille de la fenêtre d'ovulation, soir | Pic d'énergie en vue | Phase où l'énergie et l'envie de sortir sont souvent au plus haut. | idem | — |

Textes exacts FR/EN : `src/i18n/*.json`, section `notif`.

**Règles de programmation** (fonction pure `reminderSchedule(state, now) → ScheduledReminder[]`, puis un `syncNotifications()` qui applique) :
1. À chaque ouverture de l'app, retour au premier plan, et à chaque modification de l'état : annuler toutes les notifications Phases, recalculer, reprogrammer les **3 prochains cycles** (≤ 16 notifications, limite iOS : 64).
2. Ne jamais programmer une date passée.
3. Fenêtre silencieuse 22:00–08:00 : une heure réglée dedans est ramenée à la borne la plus proche.
4. Catégorie iOS `confirm-period` avec deux actions :
   - « Oui, aujourd'hui » : `opensAppToForeground: true` (fiable même si l'app était fermée). À l'ouverture, l'app lit la réponse (listener + `getLastNotificationResponseAsync()` au démarrage, dédupliquée par identifiant), appelle `startCycle(aujourd'hui)`, `syncNotifications()`, et affiche l'écran Aujourd'hui avec un message « Nouveau cycle enregistré ».
   - « Pas encore » : `opensAppToForeground: false`, ne fait rien de plus : les relances J+1… J+3 sont déjà programmées.
5. Mode discret : titre « Phases », corps `notif.discreet`, pour toutes les notifications.
6. Textes générés dans la langue active au moment de la programmation ; changer de langue ou de mode reprogramme tout.
7. Permission refusée : l'app fonctionne, bandeau dans Réglages avec bouton vers les réglages iOS (`Linking.openSettings()`).

## 7. Écrans

Références visuelles : `design/screens/*.png` (rendu) et `*.html` (structure, couleurs, espacements). Les données y sont un exemple figé : 27 sept. 2026, J24 d'un cycle de 28 jours commencé le 4 sept., prénom Sophie.

Navigation (Expo Router) :

```
app/
  _layout.tsx            // providers, i18n, thème, verrou Face ID, redirection onboarding
  onboarding/
    welcome.tsx          // 01
    last-period.tsx      // 02
    reminders.tsx        // 03
  (tabs)/
    _layout.tsx          // 3 onglets : Aujourd'hui, Calendrier, Réglages
    index.tsx            // 04 / 05 / 07 selon l'état
    calendar.tsx         // 09
    settings/index.tsx   // 13
    settings/history.tsx // 14
  guide/index.tsx        // 10
  guide/[phase].tsx      // 11 (même gabarit pour les 5 phases)
  confirm.tsx            // 06, présenté en sheet (presentation: 'formSheet')
  sync/share.tsx         // 16
  sync/receive.tsx       // 17, ouvert par le lien phases://s#… ou https://tryphases.io/s#…
  lock.tsx               // 15
```

| # | Écran | Contenu | Comportement |
| --- | --- | --- | --- |
| 01 | Bienvenue | Logo complet, titre, 2 cartes de mode, prénom optionnel, 2 lignes de réassurance | Continuer toujours actif (mode partenaire par défaut) |
| 02 | Dernières règles | Calendrier du mois (futur désactivé), steppers durée cycle (21–45) et règles (2–10) | « Je ne sais pas, je lui demande » → feuille de partage avec `onboarding.ask_message` ; en mode self ce lien est masqué |
| 03 | Rappels | 4 lignes avec interrupteurs, notifications discrètes | « Activer les rappels » demande la permission puis termine l'onboarding ; « Plus tard » termine sans permission |
| 04 | Aujourd'hui | Date, titre de phase, CycleRing, 2 pastilles (compte à rebours règles, prochain rappel), carte « Ce qui se passe » + 3 gestes, bouton principal | Tap carte → guide de la phase ; bouton → 06 |
| 05 | Aujourd'hui en retard | Anneau estompé, « J+N », carte d'explication, gestes `retard` | Deux boutons : confirmer (→ 06) / pas encore |
| 07 | Aujourd'hui mode self + irrégulier | Bandeau irrégulier au-dessus de l'anneau | Même écran que 04, variantes de texte |
| 06 | Confirmer | Sheet : 5 jours (J−2 … J+2, futur désactivé), « Autre date… », récap cycle précédent et prochaines dates, interrupteur « Envoyer la mise à jour à {name} » | Confirmer → `startCycle`, haptique succès, puis si interrupteur actif → feuille de partage avec le lien de sync |
| 09 | Calendrier | Mois en grille, pastilles colorées : pleines = passé, pointillées = prédit, aujourd'hui = rempli + contour ; cloche sous les jours de rappel ; légende ; carte du jour sélectionné | Flèches mois ± ; tap jour → carte ; appui long → « Règles commencées ce jour-là ? » |
| 10 | Les phases | Liste des 5 phases avec badge « Maintenant » | Tap → 11 |
| 11 | Fiche de phase | Pastille jours, titre, sous-titre, barre des 5 phases, « Ce qu'elle peut ressentir » (chips), « Ce qui aide », « Ce qui aide moins », disclaimer | Contenu : `src/content/phases.{fr,en}.json` |
| 12 | Notifications | Référence du rendu des 3 notifications | Pas un écran de l'app |
| 13 | Réglages | Bandeau si notifs refusées ; groupes Rappels, Cycle, Confidentialité, Données | Écran scrollable ; « Tout effacer » en rouge avec confirmation |
| 14 | Historique | 3 stats (médiane, variation, règles), liste des cycles, « Ajouter un ancien cycle » | Swipe → modifier / supprimer |
| 15 | Verrouillé | Icône, titre, bouton Face ID | Affiché au lancement et au retour au premier plan si `security.faceId` |
| 16 | Envoyer | QR code (lib `react-native-qrcode-svg`) de l'URL de sync, « Envoyer un lien », « Scanner son code » (`expo-camera`) | — |
| 17 | Mise à jour reçue | Récap du nouveau cycle, dates recalculées, note de confidentialité | « Mettre à jour » applique la fusion ; « Ignorer » ferme |

**Gestes du jour** : pour la phase courante, 3 gestes tirés de `tips_partner` ou `tips_self`, tirage **déterministe par date** (seed = numéro du jour) pour que l'écran ne change pas à chaque ouverture.

## 8. Sync à deux (sans serveur)

- URL : `https://tryphases.io/s#1.<base64url(JSON)>` ; en local `phases://s#1.<…>`. JSON : `{ "c": ["YYYY-MM-DD", …], "L": 28, "P": 5 }`.
- Encodage/décodage : porter `apps/web/assets/sync.js` en TypeScript (`src/sync/format.ts`), mêmes tests.
- Réception : décoder, fusionner (union des dates ; deux dates < 5 jours d'écart = même cycle, on garde la date reçue si elle est plus récente), montrer l'écran 17, n'écrire qu'après « Mettre à jour ».
- Ce qui est partagé : dates de début + durées par défaut. Jamais le prénom, le mode, les réglages.
- Universal Links : seulement avec le compte développeur payant (`associatedDomains`). Sans, le lien https ouvre la page `/s` du site, qui propose d'ouvrir `phases://`.

## 9. Design system

| Token | Clair | Sombre |
| --- | --- | --- |
| `bg` | #FAF6F0 | #0E0D12 |
| `surface` | #FFFFFF | #1A1820 |
| `line` | #ECE6DD | #2C2835 |
| `text` | #1C1A22 | #F3F0EA |
| `textMuted` | #6E6A75 | #9C97A6 |
| `regles` | #E0525A | #F06A71 |
| `folliculaire` | #5FA37E | #74BD95 |
| `ovulation` | #E6A23C | #F2B65A |
| `luteale` | #8A7BE0 | #A193F0 |
| `spm` | #5E4B8B | #9A86D4 |
| `good` | #3F7A5A | #74BD95 |
| `accentBg` / `accentFg` (bouton principal) | #1C1A22 / #FAF6F0 | #F3F0EA / #0E0D12 |

- Police : système arrondie iOS (`fontFamily: 'ui-rounded'` / SF Pro Rounded). Poids 700–800 pour les titres. Tailles : 64 (jour du cycle dans l'anneau), 30 (titre d'écran), 17 (corps), 15 (secondaire), 12 (labels en capitales, espacement 0.8).
- Rayons : cartes 20, boutons 18, pastilles 999. Marges d'écran 20. Grille de 8.
- Bouton principal : pleine largeur, hauteur 56.
- **CycleRing** : SVG, rayon 120 sur 300, épaisseur 20, un arc par phase (espacement 4), le SPM remplace la fin de la lutéale, point du jour blanc cerclé de `text`. Animation de tracé 600 ms à l'ouverture (Reanimated).
- Haptique : léger au changement d'onglet, `success` à la confirmation.
- Accessibilité : couleur jamais seule (nom de phase ou initiale), contraste ≥ 4.5:1, cibles ≥ 44 pt, Dynamic Type jusqu'à XL, `accessibilityLabel` sur l'anneau (« Jour 24 sur 28, SPM »).
- Mode sombre automatique (`userInterfaceStyle: automatic`).
- Logo : `apps/mobile/assets/brand/` (C3, P + demi-lune). Logo complet = `wordmark.svg` / `wordmark-on-dark.svg`.

## 10. Langues

- `expo-localization` : FR si l'iPhone est en français, sinon EN. Surcharge dans Réglages (`language`).
- `i18next` + `react-i18next`, ressources : `src/i18n/{fr,en}.json` (interface) et `src/content/phases.{fr,en}.json` (contenu éditorial).
- Dates : `Intl.DateTimeFormat(locale, …)`. Semaine du lundi en FR, du dimanche en EN.
- Textes des autorisations iOS : `src/i18n/infoplist-{fr,en}.json`.

## 11. Stack

Expo SDK 57, Expo Router, TypeScript strict, Zustand, `expo-sqlite/kv-store`, date-fns (ou arithmétique maison sur les jours), `expo-notifications`, `react-native-svg`, `react-native-reanimated`, `expo-haptics`, `expo-local-authentication`, `expo-sharing`, `expo-document-picker`, `expo-camera`, `react-native-qrcode-svg`, `expo-localization`, `i18next`, `react-i18next`. Tests : Jest (`jest-expo`).

## 12. Hors périmètre v1

Widget (v1.1, `expo-widgets`), humeur/symptômes du jour, HealthKit, iCloud/CloudKit, Android, iPad, tout ce qui demande un serveur.
