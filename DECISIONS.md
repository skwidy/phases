# Décisions

## Étape 1

- Les routes sont dans `apps/mobile/app/`, comme SPEC §7. Le template Expo SDK 57 les met dans `src/app/` ; ce dossier a été retiré. Expo Router utilise `app/` dès que `src/app` n'existe pas, donc `src/i18n` et `src/content` restent à leur place.
- `onboarding`, `guide`, `sync` et `settings` ont chacun un `_layout.tsx` (stack). Sans ça, Expo Router traiterait leurs écrans comme des onglets.
- L'app s'ouvre sur les onglets. La redirection vers l'onboarding arrive à l'étape 4.
- `expo.icon` pointe vers `./assets/icon.png` pour qu'Expo Go affiche le P. `ios.icon` porte les variantes light, dark et tinted. `associatedDomains` est absent tant qu'il n'y a pas de compte développeur payant.
- React Native 0.86 n'applique plus `Text.defaultProps`. `src/lib/applyRoundedFont.tsx` remplace l'export `Text` pour appliquer `fontFamily: 'ui-rounded'`.
- Les noms d'écrans vides viennent des clés `nav` de `src/i18n/{fr,en}.json`. La langue suit la locale de l'appareil (`Intl`) en attendant i18next à l'étape 3.

## Étape 2

- `todayStatus` sans cycle renvoie `day`, `phase` et les dates à `null`, `late` à 0, et les durées par défaut. `nextOvulation` est le jour O = L − 14 du cycle en cours, sur la même base que `nextPms` dans `sync.js`.
- La fenêtre n'existe que si 2 < σ ≤ 5. Elle entoure les prochaines règles de ± ⌈σ⌉. En dehors, `window` est `null`.
- `mergeCycles` : deux dates à moins de 5 jours sont le même cycle. Une date de `incoming` remplace celles de `existing` dans le groupe, parce que c'est la dernière saisie (`startCycle` et sync). Dans une même liste, la dernière dans l'ordre d'entrée gagne.
- Les cas encode/decode de `tests/sync.test.mjs` restent sur le moteur web. Ils seront portés avec `src/sync/format.ts` à l'étape 9. Les cas de cycle sont repris ici, avec les mêmes entrées et les mêmes résultats.

## Étape 3

- `setDebugToday` ne change que `today()`, le jour affiché. `deviceToday()` lit toujours le calendrier de l'iPhone. L'historique relatif de l'écran dev, et plus tard les notifications, s'appuient sur `deviceToday()`.
- L'historique d'exemple remplace `cycles` par les six dates du design, du 16 avril au 4 septembre 2026. Le reste de l'état reste en place. « Tout effacer » appelle `resetAll`. L'annulation des notifications attend l'étape 6.
- `importState` n'accepte qu'un `AppState` complet de version 1. Une date impossible, une durée hors 21–45 ou 2–10, une heure qui n'est pas `HH:MM`, un doublon de date ou un champ manquant est refusé : l'état ne change pas. Les cycles acceptés sont triés. Un prénom vide devient absent. `setDefaults` ignore une durée hors de ces bornes.
- La réhydratation passe par la `version` de Zustand persist (1). Un blob d'une autre version, ou un blob illisible, revient aux valeurs par défaut.
- `startCycle` passe par `mergeCycles`. La durée de règles ne suit un nouveau départ que si la date est la même. `editCycle` emporte la durée de règles vers la nouvelle date.
- La langue `auto` suit `expo-localization` : français si `languageCode` commence par `fr`, sinon anglais. i18next interpole `{{name}}` sans échappement HTML.
- `weekdayShort` commence le lundi pour une locale `fr`, le dimanche sinon. Les dates sont formatées en UTC pour rester sur le jour calendaire.

## Étape 4

- La redirection vers l'onboarding attend la fin de la réhydratation. L'écran `/dev` reste ouvert même si `onboarded` est faux, pour pouvoir injecter un historique ou changer la langue.
- Continuer à l'écran 2 n'exige pas de date. Sans jour choisi, aucun cycle n'est créé ; les durées sont enregistrées quand même. Un jour choisi passe par `startCycle`.
- « Je ne sais pas, je lui demande » ouvre la feuille de partage du système avec le texte `onboarding.ask_message` (`Share` de React Native). `expo-sharing` reste pour les fichiers, à l'étape d'export.
- « Activer les rappels » demande la permission puis appelle `completeOnboarding`, que la permission soit accordée ou refusée. Aucune notification n'est programmée.
- Les libellés des quatre rappels n'existaient pas dans les JSON : ils sont sous `onboarding`. Les pistes de progression, les jours futurs et l'interrupteur éteint utilisent `line` et `textMuted`. Le chiffre du jour choisi est en `accentFg` clair, pour rester lisible sur `regles` dans les deux modes.

