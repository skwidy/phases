# Phases — guidelines de marque (v2, « chaleureux »)

Source de vérité des couleurs : `apps/mobile/src/theme.ts` (app) et `apps/web/assets/style.css` (site). Les deux partagent les mêmes valeurs.

## Intention
Phases rapproche les couples : « se mettre en phase ». Le ton visuel est celui d'une fin de journée à deux : crème, terracotta, abricot, une touche de prune. Chaleureux, calme, jamais clinique, jamais rose bonbon.

## Couleurs
| Rôle | Clair | Sombre | Usage |
| --- | --- | --- | --- |
| `bg` | #FBF3EA | #17110E | Fond d'écran |
| `surface` | #FFFAF4 | #221915 | Cartes, feuilles |
| `line` | #EFDFCD | #3A2B24 | Bordures 1 pt, séparateurs |
| `text` | #231A17 | #F6EDE4 | Texte principal (encre chaude, pas de noir pur) |
| `textMuted` | #75665E | #B3A296 | Secondaire |
| `warm` / `accentBg` | #A94C2A | #F08A5D | Bouton principal, liens, sélection, mot mis en avant |
| `accentFg` | #FFF8F1 | #1E120C | Texte sur l'accent |
| `warmSoft` | #F7DCC4 | #3A2419 | Pastilles, fonds de badge, halo d'avatar |
| `warmGlow` | #F29E6B | #C8643B | Décor seulement (dégradés, halos), jamais pour du texte |
| `sunsetFrom → sunsetTo` | #FCE3CB → #F2B08C | #2B1C16 → #4A2A1C | Dégradé des zones « récit » (hero, carte du jour, fin de série) |
| `ink` / `inkFg` | #231A17 / #FBF3EA | inversé | Aperçus de notification, éléments « nuit » |

Couleurs de phase inchangées (règles #E0525A, folliculaire #5FA37E, ovulation #E6A23C, lutéale #3A6FA8, SPM #5E4B8B) : elles portent un sens, on ne les réchauffe pas. Elles restent réservées à l'anneau, aux pastilles et aux bandeaux de phase.

## Typographie
- Titres (écran, carte, leçon) : serif système iOS (`fonts.serif` = `ui-serif`, New York), gras 700. Un mot peut passer en italique + `warm` pour l'emphase (« Se mettre *en phase* »), une fois par écran maximum.
- Tout le reste : `ui-rounded` (déjà appliqué globalement).
- Labels en capitales : rounded 800, tracking 0.8–1.2, couleur `warm` ou `textMuted`.

## Formes et matière
- Rayons généreux : cartes 20–24, boutons 18, écrans « récit » 28–32.
- Cartes : `surface` + bordure 1 pt `line`, pas d'ombre dure. Ombre douce teintée `warm` (opacité ≤ 0.15) seulement sur l'élément héros d'un écran.
- Un seul dégradé `sunset` par écran, sur l'élément qui raconte (carte du jour, en-tête Apprendre).

## Illustrations
Aplats chauds, personnages vus de dos, sans visage. Motif récurrent : deux courbes, décalées (malentendu) puis alignées (en phase). Sources : `apps/web/assets/img/scene-*.svg`.

## Ton
Tutoiement, phrases courtes, concret. On parle de « vous deux », pas de performance. Jamais de culpabilisation, jamais de promesse médicale. Signature : « Ce genre de chose devrait être gratuit. Et privé. »

## À ne pas faire
Noir pur, violet froid en accent, rose bonbon, plus d'un dégradé par écran, texte sur `warmGlow`, lune présentée comme influençant le cycle.
