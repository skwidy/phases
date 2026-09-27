# Images du site

| Fichier | Où | Remplaçable par |
| --- | --- | --- |
| `scene-hero.svg` (600×680) | Hero de la landing | `scene-hero.jpg` 1200×1360 |
| `scene-decales.svg` (640×440) | Chapitre 01 « Le malentendu » | `scene-decales.jpg` 1280×880 |
| `scene-en-phase.svg` (640×440) | Chapitre 03 « En phase » | `scene-en-phase.jpg` 1280×880 |
| `guillaume.jpg` / `guillaume-sm.jpg` | Page /pourquoi, carte fondateur | — |

Pour passer en photo : génère l'image, exporte en JPG (qualité ~80, < 250 Ko), dépose-la ici et remplace `.svg` par `.jpg` dans `index.html`, `en/index.html`. Garde le même ratio. La CSP n'autorise que des images servies par le site (`img-src 'self' data:`), donc pas d'URL externe.

## Prompts

Style commun, à coller à la fin de chaque prompt :
> warm golden-hour light, soft film grain, palette of terracotta, apricot, cream and dusky plum, natural candid moment, faces partly turned away or out of focus, no text, no logos, no phone screens visible, editorial lifestyle photography, 35mm

1. **scene-hero** (4:4.5) : *A couple in their thirties cuddled on a terracotta linen sofa at sunset, seen from slightly behind, her head resting on his shoulder, a wool blanket over their knees, a large arched window glowing orange behind them.*
2. **scene-decales** (16:11) : *A couple at home in the evening, out of sync: she is curled up on the sofa under a blanket, tired, looking away; he stands a few meters away, enthusiastic, holding a laptop, mid-sentence. Same warm living room, slightly cooler light on her side.*
3. **scene-en-phase** (16:11) : *The same couple walking side by side on a coastal path at golden hour, holding hands, laughing, seen from behind at three-quarters, the sun low on the horizon.*
4. **Portrait (optionnel)**, avec ta photo en référence (image de référence / « character reference ») : *Same man as the reference photo, sitting at a wooden table by a window in warm late-afternoon light, black t-shirt, relaxed smile, a notebook and an iPhone face down on the table, cream and terracotta tones, shallow depth of field.* → `guillaume.jpg`, 1440×1440.
