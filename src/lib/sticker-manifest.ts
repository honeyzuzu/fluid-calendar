import type { ColorThemeId } from "@/lib/color-themes";

export type StickerAsset = {
  id: string;
  label: string;
  src: string;
  category: "decorative" | "functional" | "seasonal";
  defaultScale: number;
  aspectRatio: number;
  tags: readonly string[];
};

export type StickerAssetPack = {
  id: string;
  label: string;
  assets: readonly StickerAsset[];
};

export const SUNNIE_BASICS_STICKER_PACK: StickerAssetPack = {
  id: "sunnie-basics",
  label: "Sunnie Basics",
  assets: [
    {
      id: "sunny-star",
      label: "Sunny star",
      src: "/themes/basics/stickers/sunny-star.svg",
      category: "functional",
      defaultScale: 0.85,
      aspectRatio: 1,
      tags: ["star", "important"],
    },
    {
      id: "warm-heart",
      label: "Warm heart",
      src: "/themes/basics/stickers/warm-heart.svg",
      category: "functional",
      defaultScale: 0.85,
      aspectRatio: 1,
      tags: ["heart", "favorite"],
    },
    {
      id: "little-check",
      label: "Little check",
      src: "/themes/basics/stickers/little-check.svg",
      category: "functional",
      defaultScale: 0.8,
      aspectRatio: 1,
      tags: ["check", "done"],
    },
    {
      id: "cozy-cup",
      label: "Cozy cup",
      src: "/themes/basics/stickers/cozy-cup.svg",
      category: "functional",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["coffee", "break"],
    },
  ],
};

const themePack = (
  id: ColorThemeId,
  label: string,
  assets: readonly StickerAsset[]
): StickerAssetPack => ({ id, label, assets });

export const THEME_STICKER_PACKS: Record<ColorThemeId, StickerAssetPack> = {
  base: themePack("base", "Sunny Garden", [
    {
      id: "garden-daisy",
      label: "Garden daisy",
      src: "/themes/base/stickers/garden-daisy.svg",
      category: "decorative",
      defaultScale: 1,
      aspectRatio: 1,
      tags: ["flower", "garden"],
    },
    {
      id: "happy-sprout",
      label: "Happy sprout",
      src: "/themes/base/stickers/happy-sprout.svg",
      category: "decorative",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["sprout", "garden"],
    },
    {
      id: "garden-strawberry",
      label: "Garden strawberry",
      src: "/themes/base/stickers/garden-strawberry.svg",
      category: "decorative",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["fruit", "garden", "strawberry"],
    },
  ]),
  "spring-fresh-air": themePack("spring-fresh-air", "Fresh Air", [
    {
      id: "spring-tulip",
      label: "Spring tulip",
      src: "/themes/spring-fresh-air/stickers/spring-tulip.svg",
      category: "seasonal",
      defaultScale: 1,
      aspectRatio: 1,
      tags: ["spring", "flower"],
    },
    {
      id: "spring-bee",
      label: "Tiny bee",
      src: "/themes/spring-fresh-air/stickers/spring-bee.svg",
      category: "seasonal",
      defaultScale: 0.8,
      aspectRatio: 1,
      tags: ["spring", "bee"],
    },
    {
      id: "spring-wildflower",
      label: "Wildflower",
      src: "/themes/spring-fresh-air/stickers/spring-wildflower.svg",
      category: "seasonal",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["spring", "flower"],
    },
  ]),
  "summer-sun-kissed": themePack("summer-sun-kissed", "Sun-Kissed", [
    {
      id: "summer-lemon",
      label: "Sunny lemon",
      src: "/themes/summer-sun-kissed/stickers/summer-lemon.svg",
      category: "seasonal",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["summer", "lemon"],
    },
    {
      id: "summer-cherries",
      label: "Picnic cherries",
      src: "/themes/summer-sun-kissed/stickers/summer-cherries.svg",
      category: "seasonal",
      defaultScale: 1,
      aspectRatio: 1,
      tags: ["summer", "fruit"],
    },
    {
      id: "summer-strawberry",
      label: "Summer strawberry",
      src: "/themes/summer-sun-kissed/stickers/summer-strawberry.svg",
      category: "seasonal",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["summer", "fruit", "strawberry"],
    },
  ]),
  "autumn-golden-hour": themePack("autumn-golden-hour", "Golden Hour", [
    {
      id: "autumn-leaf",
      label: "Falling leaf",
      src: "/themes/autumn-golden-hour/stickers/autumn-leaf.svg",
      category: "seasonal",
      defaultScale: 1,
      aspectRatio: 1,
      tags: ["autumn", "leaf"],
    },
    {
      id: "autumn-apple",
      label: "Orchard apple",
      src: "/themes/autumn-golden-hour/stickers/autumn-apple.svg",
      category: "seasonal",
      defaultScale: 0.95,
      aspectRatio: 1,
      tags: ["autumn", "apple"],
    },
    {
      id: "autumn-pumpkin",
      label: "Patch pumpkin",
      src: "/themes/autumn-golden-hour/stickers/autumn-pumpkin.svg",
      category: "seasonal",
      defaultScale: 1,
      aspectRatio: 1,
      tags: ["autumn", "pumpkin"],
    },
  ]),
  "winter-candlelight-snow": themePack(
    "winter-candlelight-snow",
    "Candlelight & Snow",
    [
      {
        id: "winter-snowflake",
        label: "Soft snowflake",
        src: "/themes/winter-candlelight-snow/stickers/winter-snowflake.svg",
        category: "seasonal",
        defaultScale: 0.9,
        aspectRatio: 1,
        tags: ["winter", "snow"],
      },
      {
        id: "winter-cocoa",
        label: "Warm cocoa",
        src: "/themes/winter-candlelight-snow/stickers/winter-cocoa.svg",
        category: "seasonal",
        defaultScale: 1,
        aspectRatio: 1,
        tags: ["winter", "cocoa"],
      },
      {
        id: "winter-evergreen",
        label: "Evergreen sprig",
        src: "/themes/winter-candlelight-snow/stickers/winter-evergreen.svg",
        category: "seasonal",
        defaultScale: 0.95,
        aspectRatio: 1,
        tags: ["winter", "evergreen"],
      },
    ]
  ),
};

export function findStickerAsset(packId: string, stickerId: string) {
  const pack =
    packId === SUNNIE_BASICS_STICKER_PACK.id
      ? SUNNIE_BASICS_STICKER_PACK
      : Object.values(THEME_STICKER_PACKS).find(({ id }) => id === packId);
  return pack?.assets.find(({ id }) => id === stickerId);
}

export function isValidStickerAsset(packId: unknown, stickerId: unknown) {
  return (
    typeof packId === "string" &&
    typeof stickerId === "string" &&
    Boolean(findStickerAsset(packId, stickerId))
  );
}
