import { ReactNode } from "react";
import { FigmaBackground } from "./figma-background";
import { Topbar } from "./topbar";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <FigmaBackground />
      <Topbar />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-[122px] md:px-0 md:pt-20">
        {children}
      </main>
    </>
  );
}
