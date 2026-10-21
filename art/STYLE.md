# Cat Café Sprite Style Guide — Aqua × Cherry

## Sprite sizes
| Size | Use | Look |
|------|-----|------|
| **16×16** (`cat16_*`) | in-game / scene sprite | Chunky: bold flat shapes, 1-px eyes, max ~7 colors, at most one shade per material, no gradients. |
| **32×32** (`cat32_*`) | portraits, UI, close-ups | Detailed: eye glints, stripes, one highlight + one shadow tone, curled tail. ~10 colors. |

Scenes are painted at low res (e.g. **96×64**) with 16×16 characters at 1:1 and props as flat blocks.
Export previews with **nearest-neighbor only**: 16×16 → ×16 (256 px), 32×32 → ×8 (256 px), scenes → ×8.
No anti-aliasing, blur, or smooth scaling. Sprite backgrounds are transparent.

## Palette (13 colors) — `palette.hex` / `palette.gpl` / `palette.png`
| Role | Hex | Typical use |
|------|-----|-------------|
| outline | `#1b1420` | all sprite outlines, pupils, mouth |
| aqua-0 deep | `#0e3a44` | darkest wall/backdrop, wall-floor seam |
| aqua-1 dark | `#17606b` | walls, cat iris |
| aqua-2 mid | `#2a8f96` | floor tile A, fur stripes |
| aqua-3 bright | `#4fc1c0` | floor tile B, fur shadow, leaves |
| aqua-4 light | `#8fe3dc` | **cat fur base**, window glass |
| aqua-5 pale | `#d2f7f0` | fur highlight, glass glare |
| cherry-0 deep | `#3d0f1c` | wood/frames, cast shadows on red |
| cherry-1 dark | `#6e1a2e` | shelves, rug inner border |
| cherry-2 base | `#a3243f` | **collar**, rugs, lantern, pots |
| cherry-3 bright | `#d6435f` | ear insides, nose, cushions, heart |
| cherry-4 light | `#f08a9a` | bell, lantern glow, cushion top edge |
| cream | `#fbf1dc` | muzzle, chest, paws, eye glint, cups |

Use **only** these colors. No oranges, greens, golds, or browns; wood is cherry-0/1, plants are aqua-3/4.

## Outline rules
- 1-px **outline `#1b1420`** around every character and its outer silhouette, 4-connected (no diagonal-only gaps).
- Interior lines (mouth, paw split) also use the outline color; keep them to 1 px.
- Props in scenes don't need outlines; separate them by value contrast (dark frame vs. light glass).

## Shading rules
- Light comes from the **top-left**.
- Each material gets base + at most one shadow (+ one highlight on 32×32 only), stepping one notch along its ramp:
  fur `aqua-4` → shadow `aqua-3`, stripes `aqua-2`, highlight `aqua-5`; red `cherry-2` → shadow `cherry-1`/`cherry-0`, light `cherry-4`.
- Shadow sits on the right/bottom of forms; a 1-px `cherry-0` contact shadow sits under characters on red surfaces.
- Don't use dithering or pillow shading (shading that just follows the outline all the way round).
- Keep characters readable against the aqua floor: put them on cherry rugs/cushions, or rely on the dark outline.
