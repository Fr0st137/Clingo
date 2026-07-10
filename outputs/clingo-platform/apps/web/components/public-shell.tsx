import { ReactNode } from "react";
import { Topbar } from "./topbar";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Topbar />
      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-[122px] md:px-0 md:pt-20">
        {children}
      </main>
    </>
  );
}
