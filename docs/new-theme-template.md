# Sunnie new theme worksheet

Copy this file, fill in the blanks, and send it back when you want a new Sunnie
theme. Plain-language descriptions are welcome; you do not need to write code.

Every complete colorway needs exactly **44 hex colors**. Use six-digit hex values
such as `#A1B2C3`. Leave a name blank if you want it named later, but provide every
hex before implementation.

## 1. Theme identity

- Theme name:
- Short ID suggestion (lowercase words separated by hyphens):
- Family (`seasonal`, `character`, or `special`):
- One-sentence mood:
- Longer visual story:
- Intention motif (for example flower, fruit, animal, star, or leaf):
- Motif label:

## 2. Overarching interface colors — 14

| Stable role     | Hex       | What it controls                                 |
| --------------- | --------- | ------------------------------------------------ |
| `canvas`        | `#______` | Page background                                  |
| `surface`       | `#______` | Cards, calendar canvas, and inputs               |
| `surfaceRaised` | `#______` | Dialogs, popovers, and elevated cards            |
| `surfaceMuted`  | `#______` | Subtle panels, inactive controls, and off-hours  |
| `ink`           | `#______` | Primary text                                     |
| `inkSoft`       | `#______` | Secondary text and icons                         |
| `inkMuted`      | `#______` | Hints, timestamps, and placeholders              |
| `border`        | `#______` | Dividers, input borders, and calendar grid       |
| `primary`       | `#______` | Main buttons, selected controls, and focus ring  |
| `onPrimary`     | `#______` | Preferred text/icons on the primary color        |
| `accent`        | `#______` | Selected tabs, today highlight, cheerful accents |
| `onAccent`      | `#______` | Preferred text/icons on the accent color         |
| `warmGlow`      | `#______` | Decorative warm ambient glow                     |
| `coolGlow`      | `#______` | Decorative cool ambient glow                     |

## 3. Event palette — 8

Collection name:

| Stable slot | Swatch name | Hex       |
| ----------- | ----------- | --------- |
| `event-1`   |             | `#______` |
| `event-2`   |             | `#______` |
| `event-3`   |             | `#______` |
| `event-4`   |             | `#______` |
| `event-5`   |             | `#______` |
| `event-6`   |             | `#______` |
| `event-7`   |             | `#______` |
| `event-8`   |             | `#______` |

## 4. Project palette — 6

Collection name:

| Stable slot | Swatch name | Hex       |
| ----------- | ----------- | --------- |
| `project-1` |             | `#______` |
| `project-2` |             | `#______` |
| `project-3` |             | `#______` |
| `project-4` |             | `#______` |
| `project-5` |             | `#______` |
| `project-6` |             | `#______` |

## 5. Task palette — 6

Collection name:

| Stable slot | Swatch name | Hex       |
| ----------- | ----------- | --------- |
| `task-1`    |             | `#______` |
| `task-2`    |             | `#______` |
| `task-3`    |             | `#______` |
| `task-4`    |             | `#______` |
| `task-5`    |             | `#______` |
| `task-6`    |             | `#______` |

## 6. Friend palette — 6

Collection name:

| Stable slot | Swatch name | Hex       |
| ----------- | ----------- | --------- |
| `friend-1`  |             | `#______` |
| `friend-2`  |             | `#______` |
| `friend-3`  |             | `#______` |
| `friend-4`  |             | `#______` |
| `friend-5`  |             | `#______` |
| `friend-6`  |             | `#______` |

## 7. Status palette — 4

Collection name:

Status colors carry meaning. Success should remain reassuring, warning should
draw attention without looking dangerous, danger should clearly signal risk,
and information should remain neutral.

| Stable slot | Swatch name | Hex       |
| ----------- | ----------- | --------- |
| `success`   | Success     | `#______` |
| `warning`   | Warning     | `#______` |
| `danger`    | Danger      | `#______` |
| `info`      | Information | `#______` |

## 8. Visual style

Choose one value per row. If none feels right, describe the desired appearance
in the Notes column and a reusable primitive can be designed before the theme is
added.

| Area                   | Available choices                                                                          | Choice | Notes |
| ---------------------- | ------------------------------------------------------------------------------------------ | ------ | ----- |
| App background         | `ambient`, `paper`                                                                         |        |       |
| Main surfaces          | `clean`, `paper`, `soft`, `patterned`, `glass`                                             |        |       |
| App pattern            | `none`, `gingham`, `dot-grid`, `lined-paper`, `checker`, `stripes`, `graph-paper`, `plaid` |        |       |
| Surface pattern        | same as app pattern                                                                        |        |       |
| Sidebar pattern        | same as app pattern                                                                        |        |       |
| Border                 | `solid`, `dashed`, `hand-drawn`                                                            |        |       |
| Corner shape           | `soft`, `round`, `irregular`                                                               |        |       |
| Typography             | `normal`, `soft`, `handwritten-accent`                                                     |        |       |
| Activation motion      | `none`, `sprout`, `petals`, `leaves`, `sun-shimmer`, `snow`, `sparkle`                     |        |       |
| Sticker-pack idea      | Optional; describe the sticker subjects and style                                          |        |       |
| Illustration-pack idea | Optional; describe the illustration subjects and style                                     |        |       |

- Signature details (choose two or three):
- Pattern intensity (`subtle`, `moderate`, or `prominent`):
- Decorative density (`minimal`, `balanced`, or `maximal`):
- Decorative accent (`none` or `scalloped`):
- Washi-pack idea:

`plaid` and `graph-paper` are also available as reusable patterns. Use
`scalloped` only as a small decorative edge or cap, not as the corner treatment
for every card.

Motion is decorative and must remain subtle, one-shot where appropriate, and
fully respect reduced-motion preferences.

## 9. Calendar presentation

Classic and Bujo are independent user choices. Define how this theme should
look in both modes rather than creating separate theme IDs.

| Calendar role  | Available choices                                                                          | Classic  | Bujo |
| -------------- | ------------------------------------------------------------------------------------------ | -------- | ---- |
| Grid           | `soft`, `gingham`, `dot-grid`, `lined-paper`, `checker`, `stripes`, `graph-paper`, `plaid` | `soft`   |      |
| Events         | `solid`, `soft`, `highlight`, `outline`, `washi`, `sticky-note`                            | `soft`   |      |
| Tasks          | `solid`, `soft`, `highlight`, `outline`, `washi`, `sticky-note`                            | `soft`   |      |
| All-day events | `solid`, `soft`, `highlight`, `outline`, `washi`, `sticky-note`                            | `soft`   |      |
| Grid border    | `solid`, `dashed`, `hand-drawn`                                                            | `solid`  |      |
| Calendar type  | `normal`, `soft`, `handwritten-accent`                                                     | `normal` |      |

## 10. Planning surfaces

Choose core color roles from section 2 rather than adding extra hex values.

| Surface               | Role sequence    | Choice |
| --------------------- | ---------------- | ------ |
| Daily Rise gradient   | three core roles |        |
| Daily Unwind gradient | three core roles |        |
| Progress gradient     | two core roles   |        |

Suggested defaults:

- Daily Rise: `surface` → `accent` → `warmGlow`
- Daily Unwind: `surfaceRaised` → `surfaceMuted` → `coolGlow`
- Progress: `accent` → `primary`

## 11. Final notes and references

- Must-have visual details:
- Things to avoid:
- Reference images or links:
- Which existing Sunnie theme is closest, if any:
- Any custom primitive this theme may need:

Before release, Sunnie will validate all 44 colors, check foreground/background
contrast, verify Classic and Bujo on desktop and mobile, and confirm that custom
colors remain fixed while theme-linked slots recolor correctly.
