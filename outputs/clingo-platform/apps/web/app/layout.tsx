import type { Metadata } from "next";
import { FigmaBackground } from "../components/figma-background";
import "./globals.css";

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
