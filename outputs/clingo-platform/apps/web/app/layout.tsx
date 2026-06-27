import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clingo | Zamówienia",
  description: "Panel użytkownika Clingo zaimportowany z projektu Figma."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
