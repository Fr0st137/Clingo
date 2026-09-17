import type { Metadata } from "next";
import { FigmaBackground } from "../components/figma-background";
import "../public/clingo-homepage/styles/base.css";
import "./globals.css";
// The header must be styled before streamed page content is painted.
import "../public/clingo-homepage/styles/header-not-login.css";
import "../public/clingo-homepage/styles/home.css";

export const metadata: Metadata = {
  title: "Clingo | Rezerwacje",
  description: "Panel użytkownika Clingo zaimportowany z projektu Figma."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <head>
        <link
          as="image"
          fetchPriority="high"
          href="/clingo-homepage/assets/backgrounds/background-clingo-home.svg"
          rel="preload"
          type="image/svg+xml"
        />
      </head>
      <body>
        <FigmaBackground />
        {children}
      </body>
    </html>
  );
}
