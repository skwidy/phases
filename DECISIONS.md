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
