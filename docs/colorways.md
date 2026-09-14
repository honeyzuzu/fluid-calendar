# Sunnie colorway worksheet

Last reviewed: 2026-09-14.

Sunnie has five planner colorways: the existing **Sunnie Base** plus four
owner-supplied seasonal themes: **Spring — Fresh Air**, **Summer — Sun-Kissed**,
**Autumn — Golden Hour**, and **Winter — Candlelight & Snow**. Each theme uses
the same stable roles and palette-slot IDs, so changing themes immediately
recolors every theme-linked item without changing what that item means.

Colorways are now the color layer inside Sunnie's broader visual-theme engine.
The higher-level registry in `src/lib/planner-themes.ts` gives each theme
declarative presentation choices without changing the 44-color contract below.

## Exact color count

Each theme needs exactly **44 hex colors**:

| Group                 | Colors | Purpose                                                                |
| --------------------- | -----: | ---------------------------------------------------------------------- |
| Overarching app theme |     14 | App canvas, surfaces, typography, controls, borders, and ambient glows |
| Event palette         |      8 | Calendar feeds and individual calendar events                          |
| Project palette       |      6 | Project identity                                                       |
| Task palette          |      6 | Aesthetic task surfaces and scheduled task blocks                      |
| Friend palette        |      6 | Stable colors for friends' shared-time lanes                           |
| Status palette        |      4 | Success, warning, danger, and information meaning                      |
| **Total per theme**   | **44** |                                                                        |

The four seasonal themes supply **176 new hex values**. Together with Sunnie
Base, the completed collection contains **220 coordinated colors**.

## Available theme: Sunnie Base

**Mood:** Sunnie's original warm cream, sunny yellow, leafy green, peach, and
soft pastel planner identity.

Its coordinated story is Sunnie Base for the interface, Open Skies for events,
Sunny Garden for projects, Soft Daydreams for tasks, and Friendship Pastels for
friends. Its semantic status collection is called Sunnie Signals, and its
intention motif is a sprout.

## Seasonal interface worlds

The seasonal themes deliberately change the atmosphere of the whole planner,
not only its item palettes. Their interface identities and intention motifs are:

| Theme  | Interface world                | Primary   | Accent    | Intention motif |
| ------ | ------------------------------ | --------- | --------- | --------------- |
| Spring | Blush and lilac garden         | `#9B7190` | `#DCA7B1` | Flower          |
| Summer | Butter and aqua seaside        | `#438B91` | `#F0C95A` | Sun             |
| Autumn | Parchment, apple, and pumpkin  | `#874F3F` | `#D58A45` | Falling leaf    |
| Winter | Icy lavender and midnight blue | `#526582` | `#A99BC5` | Snowflake       |

The canvas/surface families are blush for Spring, buttery cream for Summer,
parchment and oat for Autumn, and cool blue-gray/lavender for Winter. Warm and
cool glows reinforce each environment throughout theme-aware hero surfaces.

## Available theme: Autumn — Golden Hour

**Mood:** A cozy autumn afternoon moving from the apple orchard to the pumpkin
patch, through crunchy leaves, and finally home for warm drinks by the fire.

Its coordinated story is Golden Hour for the interface, Apple Picking for
events, Pumpkin Patch for projects, Falling Leaves for tasks, and Fireside
Chats for friends. The exact 44 names and hexes are registered under the stable
slots in `src/lib/color-themes.ts`.

Its intention cards and reminders use a falling-leaf motif.

The supplied primary/on-primary pair passes WCAG AA normal-text contrast. The
pumpkin accent keeps its supplied dark companion for decorative and large text;
small accent controls automatically use Sunnie's accessible near-black fallback.

## Available theme: Spring — Fresh Air

**Mood:** The first warm days after winter—open windows, rainy mornings, tiny
flowers, garden greens, picnic blankets, and soft sunlight.

Its coordinated story is Fresh Air for the interface, April Showers for events,
Garden Party for projects, First Bloom for tasks, and Picnic Basket for friends.
The exact 44 names and hexes are registered under the stable slots in
`src/lib/color-themes.ts`.

Its intention cards and reminders use a first-flower motif.

Dusty Mauve with the supplied pale foreground measures 3.89:1. Both supplied
colors remain intact; small primary controls automatically use an accessible
near-black fallback.

## Available theme: Summer — Sun-Kissed

**Mood:** Long sunny days filled with fruit stands, salty air, garden flowers,
cold drinks, and evenings that seem to last forever.

Its coordinated story is Sun-Kissed for the interface, Strawberry Picking for
events, Farmers Market for projects, Seaside Holiday for tasks, and Summer in
Bloom for friends. The exact 44 names and hexes are registered under the stable
slots in `src/lib/color-themes.ts`.

Its intention cards and reminders use a sun motif.

Sea Glass Turquoise with the supplied pale foreground measures 3.88:1, so small
primary controls use the automatic accessible near-black fallback while both
supplied colors remain available unchanged.

## Available theme: Winter — Candlelight & Snow

**Mood:** A quiet winter day moving from fresh snowfall and evergreen branches
to baking in a warm kitchen, rosy twilight, and hot drinks under a blanket.

Its coordinated story is Candlelight & Snow for the interface, Snow Day for
events, Gingerbread House for projects, Sugar Plum for tasks, and Hot Cocoa for
friends. The exact 44 names and hexes are registered under the stable slots in
`src/lib/color-themes.ts`.

Its intention cards and reminders use a snowflake motif.

The supplied slate-blue primary and lavender accent foreground pairs pass WCAG
AA normal-text contrast.

## Why these counts

- Eight event colors are enough to distinguish connected calendars without
  turning the picker into a wall of nearly identical options. This replaces
  the former 12 event choices.
- Six project colors are enough for the small private/family scope and keep
  project identity separate from events. This replaces the former eight.
- Six task colors make tasks aesthetic rather than urgency-colored. Priority,
  energy, and duration remain compact labels instead of controlling the whole
  card color.
- Six friend colors preserve the existing friend-lane capacity and are easy to
  distinguish from one another.
- Four status colors are semantic and must always retain their meaning. They
  are not normal item choices.

## Overarching theme: 14 colors

Provide one hex for every row for each new theme.

| Stable role     | Sunnie Base | Used for                                         |
| --------------- | ----------- | ------------------------------------------------ |
| `canvas`        | `#FFF9E8`   | Page background                                  |
| `surface`       | `#FFFDF5`   | Cards, calendar canvas, inputs                   |
| `surfaceRaised` | `#FFFAF0`   | Dialogs, popovers, elevated cards                |
| `surfaceMuted`  | `#EEF3DF`   | Subtle panels, inactive controls, off-hours      |
| `ink`           | `#3F432E`   | Primary text                                     |
| `inkSoft`       | `#5F6848`   | Secondary text and icons                         |
| `inkMuted`      | `#74785F`   | Hints, timestamps, placeholders                  |
| `border`        | `#DFE2C8`   | Dividers, input borders, calendar grid           |
| `primary`       | `#64734A`   | Main buttons, selected controls, focus ring      |
| `onPrimary`     | `#FFF9E8`   | Text/icons on the primary color                  |
| `accent`        | `#F8E4A1`   | Selected tabs, today highlight, cheerful accents |
| `onAccent`      | `#77591D`   | Text/icons on the accent color                   |
| `warmGlow`      | `#F8C95D`   | Decorative warm ambient glow                     |
| `coolGlow`      | `#B8D98B`   | Decorative cool ambient glow                     |

## Mini-palette 1: Events — 8 colors

| Slot      | Sunnie Base name | Sunnie Base hex |
| --------- | ---------------- | --------------- |
| `event-1` | Cloud Blue       | `#9BC7D9`       |
| `event-2` | Soft Denim       | `#7397C7`       |
| `event-3` | Periwinkle       | `#A7ACE0`       |
| `event-4` | Sea Glass        | `#78B8B3`       |
| `event-5` | Dusty Sage       | `#7F9B83`       |
| `event-6` | Apricot          | `#E9A66F`       |
| `event-7` | Clay             | `#C98772`       |
| `event-8` | Cocoa Mauve      | `#9B7A86`       |

## Mini-palette 2: Projects — 6 colors

| Slot        | Sunnie Base name | Sunnie Base hex |
| ----------- | ---------------- | --------------- |
| `project-1` | Honey            | `#F4D27D`       |
| `project-2` | Apricot          | `#F2BE8F`       |
| `project-3` | Rose Clay        | `#DFA7A7`       |
| `project-4` | Meadow           | `#BDD39A`       |
| `project-5` | Oat              | `#DFCDA6`       |
| `project-6` | Soft Moss        | `#AFC28D`       |

## Mini-palette 3: Tasks — 6 colors

| Slot     | Sunnie Base name | Sunnie Base hex |
| -------- | ---------------- | --------------- |
| `task-1` | Peach            | `#F7BEB5`       |
| `task-2` | Sunbeam          | `#F9DA94`       |
| `task-3` | Mint             | `#C1E0CB`       |
| `task-4` | Lavender         | `#D9CFEE`       |
| `task-5` | Sky              | `#C6DCEB`       |
| `task-6` | Oat              | `#E7DFC5`       |

## Mini-palette 4: Friends — 6 colors

| Slot       | Sunnie Base name | Sunnie Base hex |
| ---------- | ---------------- | --------------- |
| `friend-1` | Lavender Mist    | `#D7CBEA`       |
| `friend-2` | Powder Blue      | `#C6DCEB`       |
| `friend-3` | Blush Cloud      | `#EBCBD7`       |
| `friend-4` | Peach Cream      | `#F0D0B7`       |
| `friend-5` | Misty Teal       | `#C5DEDA`       |
| `friend-6` | Periwinkle       | `#CBD1EE`       |

## Mini-palette 5: Status — 4 colors

| Slot      | Sunnie Base name | Sunnie Base hex |
| --------- | ---------------- | --------------- |
| `success` | Success          | `#84A75E`       |
| `warning` | Warning          | `#D99E33`       |
| `danger`  | Danger           | `#C9705C`       |
| `info`    | Information      | `#7397C7`       |

## Contract for any future theme

Provide:

1. Theme name and a one-sentence mood.
2. Fourteen overarching hexes in the role order above.
3. Eight event hexes and optional names.
4. Six project hexes and optional names.
5. Six task hexes and optional names.
6. Six friend hexes and optional names.
7. Four semantic status hexes.
8. A declarative visual definition covering surfaces, borders, typography,
   Classic/Bujo calendar presentation, optional assets, and optional motion.

Names can be decided after the colors. Every foreground/background pair will
be contrast-checked before a theme is made available.

## Theme-linked colors versus custom colors

Palette slots are stable identities. Choosing a colorway in Settings saves it
immediately and updates the interface without a page reload. For example, an
event using `event-3` displays the active theme's `event-3` hex. A custom hex is
intentionally fixed and does not change.

The theme registry and global CSS-variable application are now centralized in
`src/lib/color-themes.ts`. The database stores the selected planner colorway on
`UserSettings.colorTheme`. `CalendarFeed`, `CalendarEvent`, and `Project` store
explicit palette-slot identities separately from custom hexes. Friend slot IDs
remain browser-local. Tasks can store a theme-linked task slot or a fixed custom
hex independently of tags; tasks without a choice derive a stable aesthetic slot
from their ID. Provider feeds receive a stable event slot automatically, while an
explicit custom feed, event, or project color clears the link and stays fixed.
Google, CalDAV, and Outlook refreshes preserve Sunnie-only event color slots and
custom overrides without editing the provider event.

Color-only edits on recurring events also stay local. Series changes update all
related local occurrences together, and equivalent provider recurrence-rule
formats are normalized so a cosmetic edit cannot accidentally trigger a
provider series rewrite or create duplicate occurrences.

Settings and the event, feed, project, and friend pickers show both the
collection name and each swatch name. The seasonal collection names are April
Showers / Garden Party / First Bloom / Picnic Basket for Spring; Strawberry
Picking / Farmers Market / Seaside Holiday / Summer in Bloom for Summer; Apple
Picking / Pumpkin Patch / Falling Leaves / Fireside Chats for Autumn; and Snow
Day / Gingerbread House / Sugar Plum / Hot Cocoa for Winter.

## Visual themes and calendar styles

The first visual-theme foundation keeps color and calendar presentation
composable. `colorTheme` chooses the visual world, while the independently
persisted `calendarStyle` chooses **Classic** or **Bujo**.

- **Classic** preserves the clean, softly rounded Sunnie calendar.
- **Bujo** uses a theme-selected paper grid, selectively handwritten decorative
  headings, hand-drawn grid borders, and marker, washi, outline, or sticky-note
  item treatments.

Themes declare semantic variants such as `dot-grid`, `lined-paper`,
`graph-paper`, `marker`, `washi`, and `sticky-note`. Components and styles
consume those names through shared presentation attributes; they do not check
for individual theme IDs. This lets future packs change their design language
without adding theme-specific calendar logic.

This first version does not add sticker persistence, custom theme assets, or
ambient activation animation. The registry includes explicit asset and motion
contracts so those can be added later. Future draggable stickers should be
anchored relative to calendar dates or cells rather than raw screen pixels.

## Calendar visual direction

The first structural polish gives the calendar a raised, rounded planner
canvas; a quieter grid; softer today emphasis; clearer day typography; tighter
time rows; and one segmented view switcher. The broader calendar pass should
continue with:

- Cleaner all-day rows and month overflow.
- Better visual separation between events, tasks, and friend lanes.
- Finish replacing inherited hardcoded Base colors on secondary screens.
- Refine the recent-custom-color management around the new compact `+` control.
- Mobile-specific density and event-card typography checks.
- Add a date-relative sticker canvas and themed sticker packs after the Bujo
  presentation foundation has been tested across calendar views.
