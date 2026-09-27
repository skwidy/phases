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

## Étape 5

- Les arcs de l'anneau sont proportionnels au nombre de jours de chaque phase, avec 4 d'espacement (2 de chaque côté de la couture en haut). Le SPM remplace la fin de la lutéale, donc l'arc lutéal visible s'arrête la veille du SPM. Les longueurs du SVG de la maquette 04 ne sont pas exactement proportionnelles ; le calcul l'est, pour rester juste de 21 à 45 jours.
- Le point du jour est au milieu de l'arc de ce jour. En retard, les arcs passent à 0,35 et le point, en pointillés `regles`, est en haut. Le remplissage du point est le blanc du thème clair, pour rester blanc en mode sombre.
- En cycle irrégulier, les phases encore à venir sont à 0,6. Le bandeau utilise `surface` et `ovulation` : le crème de la maquette n'est pas un jeton.
- Sans cycle, l'anneau est un simple cercle, le titre est `today.empty`, et le bouton principal ouvre quand même la confirmation.
- Sous le jour, la phase et la date sont sur deux lignes (`SPM` puis `jusqu'au 1 oct.`), en 15 pt et dans la couleur de la phase. Une seule ligne « phase · jusqu'au date » était réduite pour tenir dans le trou de l'anneau. En retard, une seule ligne reste `today.expected`.
- Les 3 gestes sont un tirage stable pour la journée (`dayNumber`). S'il y en a moins de 3, on les affiche tous. L'ordre reste celui du contenu.
- La pastille de rappel est la prochaine date parmi les rappels activés, sur les 3 prochains cycles (veille du SPM, veille de l'ovulation, veille des règles, matin du J1 puis J+1 à J+3). Rien n'est programmé. Si aucun rappel n'est activé, la pastille est absente. Quand 2 < σ ≤ 5, la pastille des règles montre la fenêtre à la place du compte à rebours.
- L'écran Aujourd'hui relit `today()` à chaque focus, pour que la date de l'écran dev s'applique au retour.
- « Autre date… » ouvre le sélecteur natif, borné de J−7 à aujourd'hui. Les jours futurs restent désactivés, y compris J+1 et J+2 de la rangée.
- Le récapitulatif suit `mergeCycles` puis `todayStatus` sur la date choisie, sans écrire l'état avant Confirmer. Sans cycle précédent, la ligne « cycle précédent » est absente. L'interrupteur d'envoi n'est pas enregistré : l'envoi arrive à l'étape 9. En mode self sans prénom, le libellé est `confirm.send_update_self`.
- « Pas encore, redemande demain » ne fait rien.
- En mode partenaire, le titre du jour utilise le prénom quand il est renseigné (`today.title_partner_name`). Sans prénom, la phrase reste « Elle est en … ».
- Pendant la phase règles, le bouton n'est plus « Ses règles ont commencé » : il dit « Corriger le début des règles » (avec le prénom s'il existe). C'est un lien de 44 pt, pas le gros bouton. La feuille de confirmation reprend le même titre. Hors de cette phase, le bouton principal reste celui qui enregistre un début.

## Étape 6

- `reminderSchedule` prend un instant `{ date, time }` en heure locale. Une notification est passée quand son horodatage est inférieur ou égal à cet instant. L'écran dev et la programmation utilisent `deviceToday()` et l'heure de l'iPhone, pas le jour affiché.
- La fenêtre silencieuse est 22:00 inclus jusqu'à 08:00 exclu. L'heure choisie est ramenée à la borne la plus proche. À égale distance (03:00), c'est 08:00.
- Quand 2 < σ ≤ 5, tous les rappels du cycle sont avancés de ⌈σ⌉ jours, pour tomber au début de la fenêtre. Au-delà, les dates restent sur la médiane et le titre passe à « possible ». Le corps du message ne change pas.
- Les relances J+1 à J+3 sont prévues pour chacun des 3 cycles. S'il y en a plus de 16, on garde les 16 plus proches.
- Sans cycle, ou si tous les rappels sont éteints, la liste est vide.
- « Oui, aujourd'hui » appelle `startCycle(deviceToday())`. L'identifiant dédupliqué est celui de la notification plus l'action : expo-notifications n'expose pas un identifiant de réponse distinct. Il est gardé dans le kv-store, hors de l'état du cycle.
- Le bandeau des réglages n'apparaît que si la permission est refusée. Le crème de la maquette n'est pas un jeton : fond `surface`, bord `ovulation`.
- Sur iOS, une notification datée est relue comme un délai, pas comme un jour. L'écran dev lit donc l'identifiant `phases-<type>-AAAA-MM-JJTHH:MM`.

## Étape 7

- Un jour passé prend la phase du cycle réel qui le contient : la longueur est l'écart jusqu'au cycle suivant. Le cycle en cours et les 3 suivants utilisent la longueur prédite. Après la fin prévue, et jusqu'à aujourd'hui, le jour reste en retard : le cycle prédit ne recolore pas un jour déjà passé.
- La cloche marque les veilles de SPM, de règles et d'ovulation, avec les mêmes décalages que `reminderSchedule`, y compris sur les cycles passés. Les matins de confirmation ne sont pas marqués : ils tombent sur les jours de règles, et la maquette 09 ne les montre pas. Le plafond de 16 et le filtre « déjà passé » ne concernent que la programmation.
- L'avance de fenêtre (⌈σ⌉) s'applique au cycle en cours et aux cycles prédits, pas à l'historique déjà clos.
- Le libellé du jour dit le nom de la phase et son initiale. Un jour en retard n'a pas de pastille : ce n'est pas une sixième couleur.
- La lutéale est bleue (`#3A6FA8` / `#6AAEE6`), le SPM reste violet. Les deux violets d'origine se confondaient, surtout en sombre.
- Les titres du guide passent au « tu » en mode self. Le corps des fiches reste le JSON commun : il n'existe pas de variante self pour `helps`. La barre souligne la fiche ouverte. Le badge « Maintenant » suit la phase du jour.

## Apprendre

- `learn` est optionnel dans un état version 1. S'il manque, ou si `read` n'est pas une liste de textes, la valeur est `{ read: [] }`. La version reste 1 : une autre version ferait rejeter tout l'état par `parseAppState`.
- Une leçon est marquée lue à l'ouverture, pas en bas de l'écran. « En cours » est la première leçon non lue, une fois qu'au moins une leçon a été ouverte.
- La carte série utilise la paire `accentBg` / `accentFg`, donc elle s'inverse en mode sombre. La couverture du livre reste le violet clair du thème : c'est un objet dessiné, jamais la vraie couverture.
- Les tuiles des phases ouvrent `/guide/[phase]`. Aucune route nouvelle pour le cycle.

