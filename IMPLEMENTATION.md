# Guide d'implémentation — Phases

Ce guide te fait passer de ce repo à l'app installée sur ton iPhone, en 10 étapes. Chaque étape contient un prompt à coller tel quel dans Cursor, et ce que tu dois vérifier avant de passer à la suivante.

Compte 10 à 12 sessions de 2 heures. L'étape 0 (le site) est indépendante et peut se faire n'importe quand.

## Avant de commencer

**Sur ton Mac**

- Node.js 20 ou plus : `node -v`. Sinon, installe-le depuis nodejs.org.
- Git : `git --version`.
- Cursor.
- Xcode, depuis l'App Store. Il n'est utile qu'à l'étape 10 pour installer l'app en vrai, mais le téléchargement est long : lance-le maintenant.

**Sur ton iPhone**

- L'app **Expo Go**, depuis l'App Store.
- Le même réseau Wi-Fi que le Mac.

**Le repo**

1. Décompresse `phases-repo.zip`, par exemple dans `~/Code/phases`.
2. Ouvre le dossier `phases` dans Cursor (File › Open Folder).
3. Dans le terminal de Cursor :

```bash
git init
git add .
git commit -m "Phases: specs, design, site, assets"
npm test   # doit afficher "sync.test: all good"
```

4. Vérifie que Cursor a chargé les règles : Settings › Rules, `phases.mdc` doit apparaître en « Always ».

**Ce que contient le repo**

| Chemin | Rôle |
| --- | --- |
| `SPEC.md` | Ce qu'il faut construire. La référence en cas de doute |
| `design/screens/` | Les 18 écrans en PNG et HTML |
| `.cursor/rules/phases.mdc` | Les règles que Cursor applique à chaque demande |
| `apps/web/` | Le site, prêt à déployer |
| `apps/mobile/` | Pour l'instant : icônes, textes FR/EN, contenu des phases, fiche App Store. Le code de l'app viendra s'y ajouter |
| `tests/sync.test.mjs` | Les tests du calcul du cycle, qui servent de référence |

## Comment travailler avec Cursor

- Utilise le mode **Agent** (Cmd+I), avec le meilleur modèle disponible.
- **Un prompt par étape, une étape à la fois.** Ne colle pas tout le guide d'un coup.
- Quand Cursor a fini : lis le résumé, lance l'app sur l'iPhone, vérifie les critères de l'étape, puis commite : `git add . && git commit -m "Étape N"`. Si une étape part en vrille, `git checkout .` et tu relances le prompt.
- Si Cursor pose une question ou hésite, réponds « suis SPEC.md, prends l'option la plus simple et note-la dans DECISIONS.md ».
- Pour lancer l'app : `cd apps/mobile && npx expo start`, puis scanne le QR code avec l'appareil photo de l'iPhone.

---

## Étape 0 — Mettre le site en ligne (optionnel, 20 min)

Pas de prompt ici, tout se fait à la main.

1. Crée un repo **privé** sur GitHub et pousse le projet :

```bash
git remote add origin git@github.com:<toi>/phases.git
git push -u origin main
```

2. Sur vercel.com : Add New › Project › importe le repo.
   - Root Directory : `apps/web`
   - Framework Preset : Other
   - Build Command et Output Directory : vides
3. Deploy. Le site est en ligne sur une adresse `*.vercel.app`.
4. Achète le domaine (vérifie d'abord que `tryphases.io` est libre), puis ajoute-le dans Project › Settings › Domains.
5. Si le domaine n'est pas `tryphases.io`, demande à Cursor : « Remplace tryphases.io par <domaine> partout dans le repo. »

**Vérifier** : la page d'accueil, `/en`, `/confidentialite`, et le lien de test `/s#1.eyJjIjpbIjIwMjYtMDgtMDciLCIyMDI2LTA5LTA0Il0sIkwiOjI4LCJQIjo1fQ`, qui doit afficher « SPM » ou la phase du jour.

---

## Étape 1 — Créer l'app Expo

```text
Étape 1 de IMPLEMENTATION.md : crée l'app Expo dans apps/mobile.

apps/mobile contient déjà assets/, src/i18n/, src/content/ et store/ : ne les écrase pas.
1. Crée le projet dans un dossier temporaire puis fusionne sans écraser :
   cd apps && npx create-expo-app@latest _scaffold --template default
   rsync -a --ignore-existing _scaffold/ mobile/ && rm -rf _scaffold
2. Supprime les écrans et composants d'exemple du template (garde la structure Expo Router).
3. Configure app.json d'après apps/mobile/store/README.md (section app.json) : name, slug, scheme "phases", bundleIdentifier io.tryphases.app, icônes light/dark/tinted, splash, userInterfaceStyle automatic, supportsTablet false, locales. Retire associatedDomains pour l'instant.
4. TypeScript strict. Ajoute les scripts "test" (jest-expo) et "typecheck" (tsc --noEmit).
5. Crée src/theme.ts avec les tokens clair/sombre de SPEC §9 et un hook useTheme() basé sur useColorScheme().
6. Crée la navigation de SPEC §7 avec des écrans vides qui affichent juste leur nom : onboarding (3 écrans), (tabs) avec Aujourd'hui / Calendrier / Réglages, guide, confirm (formSheet), sync/share, sync/receive, lock. Icônes d'onglets : reprends les SVG de design/screens/04-aujourdhui.html.
7. Police : fontFamily 'ui-rounded' par défaut sur le Text de base.
Termine en vérifiant que typecheck passe et que l'app démarre.
```

**Vérifier** : l'app s'ouvre dans Expo Go, les 3 onglets s'affichent, l'icône sur la page d'accueil d'Expo Go est le P à demi-lune, le mode sombre de l'iPhone change le fond.

---

## Étape 2 — Le moteur du cycle (le plus important)

```text
Étape 2 : le moteur du cycle, sans aucune UI.

Crée src/lib/clock.ts : today(): ISODate (jour calendaire local), avec une surcharge possible en dev (setDebugToday(date | null)), ignorée en production.
Crée src/cycle/ en TypeScript pur, en portant exactement la logique de apps/web/assets/sync.js et en appliquant SPEC §4 :
- dates.ts : dayNumber, fromDayNumber, addDays, diffDays sur des chaînes 'YYYY-MM-DD'.
- engine.ts : predictCycleLength (médiane des 6 derniers cycles complets entre 21 et 45 j, sigma dès 3 cycles, irregular si sigma > 5), predictPeriodLength, phasesFor(length, periodLength), phaseOfDay, todayStatus(state, today) qui renvoie { day, phase, late, cycleLength, periodLength, sigma, irregular, window, nextPms, nextPeriod, nextOvulation }.
- merge.ts : mergeCycles(existing, incoming) (deux dates à moins de 5 jours = même cycle), utilisée par startCycle et par la sync.
Écris les tests Jest dans src/cycle/__tests__/ : reprends tous les cas de tests/sync.test.mjs (mêmes entrées, mêmes résultats), puis ajoute : cycle de 35 jours, cycle de 21 jours, aucun historique, 1 seul cycle, cycle hors bornes ignoré, retard J+0 / J+2, année bissextile (29 février 2028), passage à l'heure d'hiver, fenêtre quand 2 < sigma ≤ 5, fusion de deux dates proches.
Aucun composant React dans cette étape. Termine avec npm test vert.
```

**Vérifier** : `cd apps/mobile && npm test` passe, avec au moins 20 tests. Lis quelques tests pour t'assurer qu'ils disent ce que tu crois : le 27 sept. 2026 est J24, phase SPM, règles prévues le 2 oct.

---

## Étape 3 — L'état, les langues, la base

```text
Étape 3 : l'état et les langues.

1. src/store/useAppStore.ts : Zustand + persist sur expo-sqlite/kv-store, clé "phases-state", type AppState de SPEC §5, valeurs par défaut de SPEC §5. Actions : setMode, setPartnerName, setDefaults, completeOnboarding, startCycle(date) (via mergeCycles), editCycle, deleteCycle, setReminder, setReminderTime, setDiscreet, setFaceId, setLanguage, importState (avec validation), resetAll. Migration via version.
2. src/i18n/index.ts : i18next + react-i18next, ressources src/i18n/{fr,en}.json + src/content/phases.{fr,en}.json (namespace "content"). Langue : state.language si fr/en, sinon expo-localization (fr si l'iPhone est en français, sinon en). Interpolation {{name}}.
3. src/lib/format.ts : formatDay(iso, locale), formatShort(iso, locale), weekdayShort, avec Intl.DateTimeFormat. Semaine du lundi en fr, du dimanche en en.
4. Un écran dev caché (appui long 3 s sur le titre de Réglages, uniquement en __DEV__) pour : changer la date du jour affichée (setDebugToday, n'agit que sur l'affichage : les notifications suivent toujours l'horloge réelle de l'iPhone), injecter l'historique d'exemple de design/ (cycles du 16 avr. au 4 sept. 2026, pour comparer aux maquettes), injecter un historique relatif à aujourd'hui (dernier J1 = aujourd'hui − 20 jours, précédé de 5 cycles de 28 jours, pour tester les rappels), vider l'état.
Tests : store (startCycle, import invalide rejeté), i18n (clés identiques en fr et en : écris un test qui compare les deux arbres de clés).
```

**Vérifier** : tests verts. Dans l'app, l'écran dev injecte l'historique d'exemple ; ferme et rouvre Expo Go : les données sont toujours là.

---

## Étape 4 — L'onboarding

```text
Étape 4 : les 3 écrans d'onboarding, fidèles à design/screens/01, 02 et 03 (PNG pour le rendu, HTML pour les valeurs exactes).

- Redirection dans app/_layout.tsx : si !onboarded, aller à onboarding/welcome.
- 01 : logo complet (apps/mobile/assets/brand/wordmark.svg via react-native-svg, ou un composant Wordmark qui reprend ses tracés), choix du mode (2 cartes, partenaire par défaut), prénom optionnel (masqué en mode self), 2 lignes de réassurance.
- 02 : mini-calendrier du mois avec navigation, jours futurs désactivés, steppers cycle (21–45) et règles (2–10). En mode partenaire, « Je ne sais pas, je lui demande » ouvre la feuille de partage avec onboarding.ask_message. Titres selon le mode (last_period_partner / last_period_self).
- 03 : les 4 rappels avec interrupteurs (pms, period, confirm on ; ovulation off), notifications discrètes. « Activer les rappels » demande la permission (expo-notifications) puis completeOnboarding ; « Plus tard » completeOnboarding sans permission. Ne programme encore aucune notification (étape 6).
- Barre de progression 1/3, 2/3, 3/3 et bouton retour comme sur les maquettes.
Tous les textes depuis src/i18n. Composants réutilisables dans src/components/ (PrimaryButton, Card, Toggle, Stepper, ProgressDots).
```

**Vérifier** : parcours complet en moins d'une minute, en FR puis en EN (change la langue de l'iPhone, ou le réglage `language` via l'écran dev). Refuser la permission ne bloque rien.

---

## Étape 5 — L'écran Aujourd'hui

```text
Étape 5 : l'écran Aujourd'hui et la confirmation des règles, d'après design/screens/04, 05, 06, 07 et 08.

- src/components/CycleRing.tsx : SPEC §9 (SVG 300×300, r=120, épaisseur 20, arcs par phase avec 4 d'espacement, SPM par-dessus la fin de la lutéale, point du jour, jour et phase au centre), longueur de cycle variable 21–45, animation du tracé 600 ms (Reanimated), accessibilityLabel.
- (tabs)/index.tsx à partir de todayStatus(state, today()) :
  • cas normal (04) : titre selon la phase et le mode (today.title_partner / title_self), 2 pastilles (règles dans N j ; prochain rappel actif), carte « Ce qui se passe » (content.<phase>.today_partner|today_self) + 3 gestes tirés de tips_partner|tips_self avec un tirage déterministe (seed = dayNumber(today)), bouton principal.
  • retard (05) : anneau estompé, J+N, texte today.late_text, gestes content.retard, bouton confirmer + « Pas encore, redemande demain » (ne fait rien de plus pour l'instant).
  • irrégulier (07) : bandeau today.irregular avec min et max des cycles retenus ; dates en fenêtre si 2 < sigma ≤ 5.
  • tap sur la carte → guide/<phase>.
- confirm.tsx (06) en formSheet : 5 jours (J−2 à J+2, futur désactivé), « Autre date… » (date picker ±7 j), récap cycle précédent / prochain SPM / prochaines règles calculé en direct, interrupteur « Envoyer la mise à jour à {{name}} » (visible seulement si partnerName ou mode self ; l'envoi réel arrive à l'étape 9). Confirmer → startCycle, haptique success, fermeture.
- Le bouton principal ne doit jamais passer sous la barre d'onglets : utilise les safe areas et un ScrollView si l'écran est petit (iPhone SE).
```

**Vérifier** avec l'écran dev : 27/09/2026 donne J24 et SPM, comme la maquette 04 ; 04/10/2026 donne J+2, comme la maquette 05. Confirmer les règles fait repartir l'anneau à J1. Teste aussi sur un petit écran (simulateur iPhone SE si tu as Xcode).

---

## Étape 6 — Les rappels

```text
Étape 6 : les notifications locales, SPEC §6. C'est la fonction la plus importante de l'app.

1. src/reminders/schedule.ts : fonction pure reminderSchedule(state, now, t) → liste { id, date (ISO + heure locale), kind, title, body, categoryId? } pour les 3 prochains cycles, en respectant : rappels activés, heures du soir et du matin, fenêtre 22:00–08:00, dates passées exclues, fenêtre d'incertitude (début de fenêtre), relances confirm J+1 à J+3, mode discret, mode partner/self, langue. Tests Jest exhaustifs (au moins : cycle normal, cycle irrégulier, rappel déjà passé aujourd'hui, heure dans la fenêtre silencieuse, mode discret, tout désactivé).
2. src/reminders/sync.ts : syncNotifications() = cancelAllScheduledNotificationsAsync puis scheduleNotificationAsync pour chaque entrée (trigger type date). Catégorie "confirm-period" avec les actions « Oui, aujourd'hui » (opensAppToForeground: true) et « Pas encore » (opensAppToForeground: false).
3. Appelle syncNotifications() : au démarrage, au retour au premier plan (AppState), après chaque changement du store qui touche cycles, defaults, reminders, mode, partnerName ou language (abonnement Zustand avec comparaison).
4. Réponses aux notifications : listener + getLastNotificationResponseAsync() au démarrage, dédupliqués par identifiant de réponse. « Oui, aujourd'hui » → startCycle(today()), puis toast « Nouveau cycle enregistré » sur Aujourd'hui.
5. Écran dev : liste des notifications programmées (getAllScheduledNotificationsAsync) avec date et titre, et un bouton « Programmer un rappel de test dans 1 min ».
6. Réglages → section Rappels : interrupteurs et heures (DateTimePicker en mode time). Bandeau « Notifications désactivées » si la permission est refusée, avec Linking.openSettings().
```

**Vérifier** : injecte l'historique relatif (J1 = aujourd'hui − 20 jours). L'écran dev doit lister « SPM demain » dans 0 jour (ce soir, 19:00), « Règles attendues demain » dans 7 jours à 19:00, « Ça a commencé ? » dans 8 jours à 09:00, puis les mêmes pour les 2 cycles suivants. Le rappel de test arrive avec l'app fermée. Appuie longuement sur une notification de confirmation : les deux boutons apparaissent et « Oui, aujourd'hui » crée le cycle.

---

## Étape 7 — Calendrier et guide

```text
Étape 7 : calendrier et guide, d'après design/screens/09, 10 et 11.

- (tabs)/calendar.tsx : grille du mois (semaine du lundi en fr, du dimanche en en), navigation mois ±, pastille par jour colorée selon la phase (passé = fond teinté, aujourd'hui = plein + contour, futur prédit = contour pointillé), initiale de la phase en accessibilityLabel, cloche sous les jours de rappel (depuis reminderSchedule), légende, carte du jour sélectionné (phase, jour du cycle, prochaines règles). Appui long sur un jour passé → « Règles commencées ce jour-là ? » → startCycle(date).
- La couleur d'un jour se calcule à partir du cycle qui le contient : cycles passés réels pour le passé, cycles prédits (3 à venir) pour le futur.
- guide/index.tsx : les 5 phases dans l'ordre, badge « Maintenant » sur la phase courante.
- guide/[phase].tsx : gabarit unique pour les 5 phases, contenu depuis src/content/phases.<lang>.json (range_hint, subtitle, may_feel, helps, helps_less), barre des 5 phases avec la courante soulignée, disclaimer.
```

**Vérifier** : septembre 2026 avec l'historique d'exemple ressemble à la maquette 09. Les 5 fiches du guide s'ouvrent, en FR et en EN.

---

## Étape 8 — Réglages, historique, sécurité

```text
Étape 8 : réglages, historique, verrouillage, d'après design/screens/13, 14 et 15.

- (tabs)/settings/index.tsx : ScrollView groupée comme la maquette : Rappels (étape 6), Cycle (mode, prénom, durées par défaut, historique), Confidentialité (Face ID, notifications discrètes, langue auto/fr/en), Données (synchroniser → sync/share, exporter, importer, tout effacer). Pied de page avec version et settings.footer.
- settings/history.tsx : stats (médiane, variation ±sigma, durée des règles), liste des cycles du plus récent au plus ancien avec durée et écart à la médiane, swipe pour modifier (date picker) ou supprimer (confirmation), « Ajouter un ancien cycle ».
- Export : JSON de AppState en fichier phases-backup-AAAA-MM-JJ.json via expo-sharing. Import : expo-document-picker, validation stricte, écran de confirmation, remplacement, syncNotifications().
- Tout effacer : alerte de confirmation, resetAll, cancelAll, retour à l'onboarding.
- Face ID : si security.faceId, afficher lock.tsx au lancement et au retour au premier plan (après 60 s en arrière-plan), expo-local-authentication, repli sur le code de l'iPhone. Activer l'option demande une authentification réussie d'abord.
```

**Vérifier** : exporte, efface tout, réimporte le fichier : tout revient, rappels compris. Face ID bloque bien l'app après un passage en arrière-plan.

---

## Étape 9 — La sync à deux

```text
Étape 9 : sync par QR code et par lien, SPEC §8, d'après design/screens/16 et 17.

- src/sync/format.ts : port TypeScript exact de encode/decode/shareUrl de apps/web/assets/sync.js (version "1.", base64url, validation). Tests : aller-retour, rejet des entrées invalides, et le cas du fichier de test web (même chaîne produite pour les mêmes cycles).
- sync/share.tsx : QR code (react-native-qrcode-svg) de shareUrl(state), bouton « Envoyer un lien à distance » (feuille de partage avec l'URL), bouton « Scanner son code » (expo-camera, lecture QR, accepte https://tryphases.io/s#… et phases://s#…).
- Liens entrants : gère phases://s#… (expo-linking, le fragment après #) et ouvre sync/receive avec le payload.
- sync/receive.tsx : décode, calcule la fusion avec mergeCycles sans l'appliquer, affiche le récap (nouveau cycle, cycle précédent, rappels recalculés), « Mettre à jour » applique + syncNotifications(), « Ignorer » ferme. Payload invalide : message sync propre, jamais de crash.
- Branche l'interrupteur « Envoyer la mise à jour » de l'écran confirm : après confirmation, ouvre la feuille de partage avec le lien.
Ne partage jamais le prénom, le mode ou les réglages.
```

**Vérifier** : avec deux iPhone (ou un iPhone et le simulateur), confirme des règles sur l'un, scanne le QR avec l'appareil photo de l'autre, l'écran 17 s'affiche et la mise à jour recale les rappels. Le lien envoyé par iMessage ouvre la page `/s` du site, puis « Ouvrir dans Phases ».

---

## Étape 10 — Finitions et installation

```text
Étape 10 : finitions avant installation.

- Passe sur tous les écrans en comparant avec design/screens : espacements, tailles, couleurs, mode sombre, Dynamic Type (taille XL), VoiceOver (chaque élément a un label).
- Vérifie qu'aucun texte n'est en dur (grep des chaînes dans app/ et src/components/), et que fr.json et en.json ont les mêmes clés.
- Vérifie qu'aucun appel réseau n'existe : grep fetch, XMLHttpRequest, axios, http:// et https:// dans app/ et src/ (seule exception : l'URL de partage dans src/sync/format.ts).
- Retire l'écran dev des builds de production (__DEV__).
- Écris DECISIONS.md avec les choix pris pendant le dev.
```

Ensuite, installe l'app pour de vrai. Deux options :

**Gratuit, avec ton Apple ID** (l'app expire au bout de 7 jours ; tu la réinstalles avec la même commande) :

```bash
cd apps/mobile
npx expo prebuild --platform ios
npx expo run:ios --device
```

Choisis ton iPhone dans la liste. La première fois, Xcode demande de te connecter avec ton Apple ID (Settings › Accounts). Sur l'iPhone, autorise le développeur dans Réglages › Général › VPN et gestion de l'appareil.

**Apple Developer Program à 99 $/an** (TestFlight, pas d'expiration, partage à des amis, puis App Store) :

```bash
npm i -g eas-cli
eas login
eas build --platform ios --profile production
eas submit --platform ios
```

Puis sur App Store Connect : fiche et captures depuis `apps/mobile/store/`, confidentialité « Data Not Collected ». Pense à remettre `associatedDomains` dans app.json et à remplacer `TEAMID` dans `apps/web/.well-known/apple-app-site-association` pour que les liens ouvrent directement l'app.

---

## Tests à faire sur l'iPhone avant de t'en servir pour de vrai

Les rappels ne se vérifient bien qu'en conditions réelles. Injecte l'historique relatif (écran dev), puis avance la date de l'iPhone à la main (Réglages iOS › Général › Date et heure, désactive « Réglage automatique ») juste avant chaque échéance. Remets le réglage automatique à la fin.

- [ ] Le soir du J21 : « SPM demain » arrive à 19:00.
- [ ] Le soir du J28 : « Règles attendues demain » arrive à 19:00.
- [ ] Le matin du J1 prévu : « Ça a commencé ? » arrive à 09:00, avec les deux boutons en appui long.
- [ ] « Oui, aujourd'hui » depuis l'écran verrouillé, app fermée : un nouveau cycle est créé et les rappels suivants se recalent.
- [ ] « Pas encore » : la relance arrive le lendemain à 09:00, et s'arrête après J+3.
- [ ] Heure du soir réglée à 23:00 : le rappel est ramené à 22:00.
- [ ] Mode discret : le texte affiché sur l'écran verrouillé est neutre.
- [ ] Langue de l'iPhone passée en anglais : les rappels suivants sont en anglais.
- [ ] Mode avion pendant toute l'utilisation : rien ne change.
- [ ] Désinstaller puis réinstaller l'app : elle repart de zéro (normal) ; l'import de la sauvegarde restaure tout.

## En cas de problème

- **Cursor s'égare ou code trop à la fois** : `git checkout .`, puis relance le prompt de l'étape en ajoutant « fais seulement ce qui est écrit, rien d'autre ».
- **Une notification n'arrive pas** : écran dev › liste des notifications programmées. Si elle n'y est pas, le problème est dans reminderSchedule (voir ses tests) ; si elle y est, vérifie la permission et le mode Concentration de l'iPhone.
- **« Unable to resolve module »** après un `npx expo install` : `npx expo start -c` pour vider le cache.
- **Écarts de dates d'un jour** : quelque part, un `new Date()` ou un timestamp sert au calcul. Tout doit passer par `today()` et les fonctions de `src/cycle/dates.ts`.
