import { ComponentProps } from "react";

import {
  Flower2,
  Leaf,
  type LucideIcon,
  Snowflake,
  Sprout,
  Sun,
} from "lucide-react";

import { ColorThemeMotifId } from "@/lib/color-themes";

const THEME_MOTIF_ICONS: Record<ColorThemeMotifId, LucideIcon> = {
  sprout: Sprout,
  flower: Flower2,
  sun: Sun,
  "autumn-leaf": Leaf,
  snowflake: Snowflake,
};

export function getThemeMotifIcon(motif: ColorThemeMotifId) {
  return THEME_MOTIF_ICONS[motif] || Sprout;
}

type ThemeMotifIconProps = ComponentProps<LucideIcon> & {
  motif: ColorThemeMotifId;
};

export function ThemeMotifIcon({ motif, ...props }: ThemeMotifIconProps) {
  const Icon = getThemeMotifIcon(motif);
  return <Icon {...props} />;
}
