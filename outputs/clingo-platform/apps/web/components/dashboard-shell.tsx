"use client";

import { ReactNode, useState } from "react";
import { AccountBackground } from "./account-background";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  active: string;
  children: ReactNode;
};

export function DashboardShell({ active, children }: DashboardShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <AccountBackground />
      <Topbar isMenuOpen={isMenuOpen} onMenuToggle={() => setIsMenuOpen((value) => !value)} />
      <main className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 px-4 pt-[122px] md:grid-cols-[320px_minmax(0,1090px)] md:gap-[30px] md:px-0 md:pt-[90px]">
        <div className="hidden md:block">
          <Sidebar active={active} />
        </div>
        {isMenuOpen ? (
          <div className="fixed inset-x-4 top-[118px] z-40 md:hidden">
            <Sidebar active={active} compact />
          </div>
        ) : null}
        <div className={isMenuOpen ? "pointer-events-none blur-sm md:pointer-events-auto md:blur-0" : ""}>{children}</div>
      </main>
    </>
  );
}
