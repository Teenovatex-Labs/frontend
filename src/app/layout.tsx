import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";

// Self-hosted (latin subset) so the build never depends on Google Fonts.
const poppins = localFont({
  src: [
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = localFont({
  src: [
    { path: "../fonts/playfair-display-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/playfair-display-latin-500-italic.woff2", weight: "500", style: "italic" },
    { path: "../fonts/playfair-display-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/playfair-display-latin-600-italic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeenovateX Labs | Build the Technology you Wish Existed",
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
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
