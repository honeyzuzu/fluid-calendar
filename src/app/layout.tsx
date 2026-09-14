import type { CSSProperties } from "react";

import { Kalam, Nunito_Sans } from "next/font/google";

import { Providers } from "@/components/providers";

import {
  getDisplayPreferenceHtmlAttributes,
  getDisplayPreferencePrepaintScript,
  getDisplayPreferenceSnapshot,
} from "@/lib/display-preferences";

import "../styles/motion.css";
import "../styles/surfaces.css";
import "../styles/tokens.css";
import "./globals.css";
import { metadata as baseMetadata } from "./metadata";

const sunnieUi = Nunito_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sunnie-ui",
});

const sunnieHand = Kalam({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sunnie-hand",
  weight: ["400", "700"],
});

export const metadata = baseMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialDisplay = getDisplayPreferenceSnapshot("base", "classic");

  return (
    <html
      lang="en"
      className={`${sunnieUi.variable} ${sunnieHand.variable} min-h-full`}
      style={initialDisplay.variables as CSSProperties}
      suppressHydrationWarning
      {...getDisplayPreferenceHtmlAttributes("base", "classic")}
    >
      <head>
        <script
          id="sunnie-display-prepaint"
          dangerouslySetInnerHTML={{
            __html: getDisplayPreferencePrepaintScript(),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
