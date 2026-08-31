import { Providers } from "@/components/providers";
import { metadata as baseMetadata } from "./metadata";

export const metadata = baseMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="min-h-full" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
