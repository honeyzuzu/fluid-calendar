# Sunnie colorway worksheet

Last reviewed: 2026-09-14.

Sunnie has five planner colorways: the existing **Sunnie Base** plus four
owner-supplied seasonal themes: **Spring — Fresh Air**, **Summer — Sun-Kissed**,
**Autumn — Golden Hour**, and **Winter — Candlelight & Snow**. Each theme uses
the same stable roles and palette-slot IDs so changing themes can eventually
recolor every theme-linked item without changing what that item means.

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

## Available theme: Autumn — Golden Hour

**Mood:** A cozy autumn afternoon moving from the apple orchard to the pumpkin
patch, through crunchy leaves, and finally home for warm drinks by the fire.

Its coordinated story is Golden Hour for the interface, Apple Picking for
events, Pumpkin Patch for projects, Falling Leaves for tasks, and Fireside
Chats for friends. The exact 44 names and hexes are registered under the stable
slots in `src/lib/color-themes.ts`.

The supplied primary/on-primary and accent/on-accent pairs pass WCAG AA normal
text contrast. Weathered Taupe is preserved for decorative muted details, while
small muted labels use the darker Olive Bark role for reliable readability.

## Available theme: Spring — Fresh Air

**Mood:** The first warm days after winter—open windows, rainy mornings, tiny
flowers, garden greens, picnic blankets, and soft sunlight.

Its coordinated story is Fresh Air for the interface, April Showers for events,
Garden Party for projects, First Bloom for tasks, and Picnic Basket for friends.
The exact 44 names and hexes are registered under the stable slots in
`src/lib/color-themes.ts`.

Matcha Leaf with the supplied Petal White measures 4.49:1, just below the 4.5:1
normal-text target. Both supplied colors remain intact; small primary controls
automatically use Sunnie's nearly identical accessible warm-white fallback.

## Available theme: Summer — Sun-Kissed

**Mood:** Long sunny days filled with fruit stands, salty air, garden flowers,
cold drinks, and evenings that seem to last forever.

Its coordinated story is Sun-Kissed for the interface, Strawberry Picking for
events, Farmers Market for projects, Seaside Holiday for tasks, and Summer in
Bloom for friends. The exact 44 names and hexes are registered under the stable
slots in `src/lib/color-themes.ts`.

Sea Glass with Coconut Cream measures 3.88:1, so small primary controls use the
automatic accessible dark-text fallback while both supplied colors remain
available unchanged.

## Available theme: Winter — Candlelight & Snow

**Mood:** A quiet winter day moving from fresh snowfall and evergreen branches
to baking in a warm kitchen, rosy twilight, and hot drinks under a blanket.

Its coordinated story is Candlelight & Snow for the interface, Snow Day for
events, Gingerbread House for projects, Sugar Plum for tasks, and Hot Cocoa for
friends. The exact 44 names and hexes are registered under the stable slots in
`src/lib/color-themes.ts`.

Cranberry Cream with Mulled Berry measures 4.29:1, so small accent controls use
the automatic accessible dark-text fallback while both supplied colors remain
available unchanged.

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

Names can be decided after the colors. Every foreground/background pair will
be contrast-checked before a theme is made available.

## Theme-linked colors versus custom colors

Palette slots are stable identities. For example, an event assigned
`event-3` keeps that slot when the planner changes themes and receives the new
theme's `event-3` hex. A custom hex is intentionally fixed and does not change.

The theme registry and global CSS-variable application are now centralized in
`src/lib/color-themes.ts`. The database stores the selected planner colorway on
`UserSettings.colorTheme`. A later data migration will add stable palette-slot
keys to events, feeds, projects, tasks, and friend preferences before automatic
recoloring of already-created items is enabled.

## Calendar visual direction

The first structural polish gives the calendar a raised, rounded planner
canvas; a quieter grid; softer today emphasis; clearer day typography; tighter
time rows; and one segmented view switcher. The broader calendar pass should
continue with:

- Theme-linked event and task colors.
- Cleaner all-day rows and month overflow.
- Better visual separation between events, tasks, and friend lanes.
- Priority and energy labels that do not recolor the entire task.
- Refine the recent-custom-color management around the new compact `+` control.
- Mobile-specific density and event-card typography checks.
