import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "TeenovateX Labs | What if you actually built it?",
  description:
    "A youth-led tech community for teenagers to connect, explore technology and build ideas together. Find your people at TeenovateX Labs.",
};

export const viewport: Viewport = {
  themeColor: "#fff9eb",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
