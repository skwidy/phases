# Décisions

## Étape 1

- Les routes sont dans `apps/mobile/app/`, comme SPEC §7. Le template Expo SDK 57 les met dans `src/app/` ; ce dossier a été retiré. Expo Router utilise `app/` dès que `src/app` n'existe pas, donc `src/i18n` et `src/content` restent à leur place.
- `onboarding`, `guide`, `sync` et `settings` ont chacun un `_layout.tsx` (stack). Sans ça, Expo Router traiterait leurs écrans comme des onglets.
- L'app s'ouvre sur les onglets. La redirection vers l'onboarding arrive à l'étape 4.
- `expo.icon` pointe vers `./assets/icon.png` pour qu'Expo Go affiche le P. `ios.icon` porte les variantes light, dark et tinted. `associatedDomains` est absent tant qu'il n'y a pas de compte développeur payant.
- React Native 0.86 n'applique plus `Text.defaultProps`. `src/lib/applyRoundedFont.tsx` remplace l'export `Text` pour appliquer `fontFamily: 'ui-rounded'`.
- Les noms d'écrans vides viennent des clés `nav` de `src/i18n/{fr,en}.json`. La langue suit la locale de l'appareil (`Intl`) en attendant i18next à l'étape 3.
